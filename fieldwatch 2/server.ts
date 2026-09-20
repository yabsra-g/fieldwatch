import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword } from './server/db';
import { generateAgriBroResponse } from './server/openai';
import { analyzeIncidentPhoto, AiNotConfiguredError } from './server/reportVision';
import {
  authenticateFarmerWithSupabase,
  backfillFarmerStatuses,
  listFarmersFromSupabase,
  checkSupabaseConnection,
  SUPABASE_CONFIG,
} from './server/supabase';

dotenv.config();

const app = express();
const PORT = 3000;

// Photos are sent as base64, so this route needs a larger body limit than the default
app.use('/api/report/analyze-image', express.json({ limit: '10mb' }));
app.use(express.json());

// Authentication Middleware
function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const session = db.validateSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  (req as any).user = session.user;
  (req as any).role = session.role;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req as any).role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
  }
  next();
}

// ================= API ROUTES =================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FieldWatch Health API',
    databaseConfigured: true,
  });
});

app.get('/api/supabase/status', async (req, res) => {
  try {
    const status = await checkSupabaseConnection();
    res.json({ ...status, jwksUrl: SUPABASE_CONFIG.jwksUrl });
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      error: err.message,
    });
  }
});

// Photo -> suggested report fields (the farmer reviews and approves before anything is sent)
app.post('/api/report/analyze-image', authenticateUser, async (req, res) => {
  try {
    const { image, symptoms } = req.body || {};
    if (typeof image !== 'string' || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: 'An image and the symptom list are required.' });
    }
    const options = symptoms
      .filter((s: any) => s && typeof s.id === 'string' && typeof s.name === 'string' && Array.isArray(s.hosts))
      .map((s: any) => ({ id: s.id, name: s.name, hosts: s.hosts.map(String) }));
    res.json(await analyzeIncidentPhoto(image, options));
  } catch (err: any) {
    if (err instanceof AiNotConfiguredError) {
      return res.status(503).json({ code: 'ai_not_configured', error: err.message });
    }
    res.status(422).json({ error: err.message || 'Photo analysis failed.' });
  }
});

// 1. Farmer Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, email, district, village, password } = req.body;

    if (!name || !phone || !password || !district) {
      return res.status(400).json({ error: 'Name, phone, password, and district are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const result = await db.registerFarmer({
      name,
      phone,
      email,
      district,
      village: village || 'Local Community',
      passwordPlain: password,
    });

    if (result.error) {
      return res.status(409).json({ error: result.error });
    }

    // New farmer is in "pending" status until approved
    res.status(201).json({
      message: 'Registration submitted successfully. Your account is pending verification by the district veterinary administrator.',
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        district: result.user.district,
        role: result.user.role,
        status: result.user.status,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// 2. Login (for both Farmers and Admins)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier (phone/email) and password are required.' });
    }

    let user = db.findUserByPhoneOrEmail(identifier);
    let isMatch = user ? verifyPassword(password, user.passwordHash, user.salt) : false;

    // Not known here (or password differs)? Check Supabase, the shared farmer database.
    if (!isMatch && (!user || user.role === 'farmer')) {
      const remote = await authenticateFarmerWithSupabase(identifier, password);
      if (remote) {
        user = db.restoreFarmerFromSupabase(remote, password);
        isMatch = true;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Account not found with this phone number or email.' });
    }
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Role-based approval check for farmers
    if (user.role === 'farmer') {
      if (user.status === 'pending') {
        return res.status(403).json({
          error: 'Your farmer registration is currently PENDING approval by the district veterinary administrator. Once verified, you will be able to log in.',
          status: 'pending',
        });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({
          error: 'Your registration was not approved. Please contact the district agricultural and livestock office for assistance.',
          status: 'rejected',
        });
      }
    }

    // Create session token
    const token = db.createSession(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        district: user.district,
        village: user.village,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// 3. Current User
app.get('/api/auth/me', authenticateUser, (req, res) => {
  const user = (req as any).user;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      district: user.district,
      village: user.village,
      role: user.role,
      status: user.status,
    },
  });
});

// 4. Logout
app.post('/api/auth/logout', authenticateUser, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.substring(7);
    db.removeSession(token);
  }
  res.json({ message: 'Logged out successfully' });
});

// 5. Admin: List Farmers with Approval Status
app.get('/api/admin/farmers', authenticateUser, requireAdmin, (req, res) => {
  try {
    const farmers = db.getAllFarmers().map((f) => ({
      id: f.id,
      name: f.name,
      phone: f.phone,
      email: f.email,
      district: f.district,
      village: f.village,
      status: f.status,
      createdAt: f.createdAt,
      approvedAt: f.approvedAt,
      approvedBy: f.approvedBy,
      rejectionReason: f.rejectionReason,
    }));
    res.json({ farmers });
  } catch (err: any) {
    console.error('Fetch farmers error:', err);
    res.status(500).json({ error: 'Failed to retrieve farmers list.' });
  }
});

// 6. Admin: Approve Farmer Registration
app.post('/api/admin/farmers/:id/approve', authenticateUser, requireAdmin, (req, res) => {
  try {
    const admin = (req as any).user;
    const farmerId = req.params.id;
    const updated = db.updateFarmerStatus(farmerId, 'approved', admin.name);

    if (!updated) {
      return res.status(404).json({ error: 'Farmer account not found.' });
    }

    res.json({
      message: `Farmer ${updated.name} has been approved. They can now access the full application.`,
      farmer: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        approvedAt: updated.approvedAt,
      },
    });
  } catch (err: any) {
    console.error('Approve farmer error:', err);
    res.status(500).json({ error: 'Failed to approve farmer.' });
  }
});

// 7. Admin: Reject Farmer Registration
app.post('/api/admin/farmers/:id/reject', authenticateUser, requireAdmin, (req, res) => {
  try {
    const farmerId = req.params.id;
    const updated = db.updateFarmerStatus(farmerId, 'rejected');

    if (!updated) {
      return res.status(404).json({ error: 'Farmer account not found.' });
    }

    res.json({
      message: `Farmer registration for ${updated.name} was rejected.`,
      farmer: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (err: any) {
    console.error('Reject farmer error:', err);
    res.status(500).json({ error: 'Failed to reject farmer.' });
  }
});

// 8. AgriBro Chatbot Proxy Endpoint (OpenAI API integration)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const reply = await generateAgriBroResponse(messages);
    res.json({ reply });
  } catch (err: any) {
    console.error('AgriBro Chatbot error:', err);
    res.status(500).json({
      error: 'AgriBro encountered a temporary issue. Please try again or rephrase your question.',
      details: err.message,
    });
  }
});

// ================= VITE / PRODUCTION STATIC SERVING =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FieldWatch Server running on http://0.0.0.0:${PORT}`);
    // Bring in farmers stored in Supabase, then keep Supabase in step with the local ones
    listFarmersFromSupabase()
      .then((remote) => {
        const added = db.importFarmersFromSupabase(remote);
        if (added > 0) console.log(`Imported ${added} farmer(s) from Supabase.`);
        return backfillFarmerStatuses(db.getAllFarmers());
      })
      .catch(() => {});
  });
}

startServer();
