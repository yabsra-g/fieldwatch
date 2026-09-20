import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  createFarmerInSupabase,
  updateSupabaseUserStatus,
  SupabaseFarmer,
  SUPABASE_CONFIG,
} from './supabase';

// Supabase Database configuration keys provided in requirements
export const DATABASE_CONFIG = {
  url: SUPABASE_CONFIG.url,
  secretKey: SUPABASE_CONFIG.secretKey,
  publishableKey: SUPABASE_CONFIG.publishableKey,
  jwksUrl: SUPABASE_CONFIG.jwksUrl,
};

export type UserRole = 'farmer' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  district: string;
  village: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  salt: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'fieldwatch_database.json');

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  configMetadata: {
    initialized: boolean;
    publishableKey: string;
    secretKeyHash: string;
  };
}

// Password hashing with salt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', finalSalt).update(password).digest('hex');
  return { hash, salt: finalSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
}

// Default seed users
function getInitialData(): DatabaseSchema {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminHash = crypto.createHmac('sha256', adminSalt).update('admin123').digest('hex');

  const farmerSalt = crypto.randomBytes(16).toString('hex');
  const farmerHash = crypto.createHmac('sha256', farmerSalt).update('farmer123').digest('hex');

  const pendingSalt = crypto.randomBytes(16).toString('hex');
  const pendingHash = crypto.createHmac('sha256', pendingSalt).update('farmer123').digest('hex');

  const secretKeyHash = crypto
    .createHash('sha256')
    .update(DATABASE_CONFIG.secretKey)
    .digest('hex');

  return {
    configMetadata: {
      initialized: true,
      publishableKey: DATABASE_CONFIG.publishableKey,
      secretKeyHash,
    },
    users: [
      {
        id: 'usr_admin_01',
        name: 'Dr. Kariuki (Chief Veterinary Officer)',
        phone: '+254 700 000 001',
        email: 'admin@fieldwatch.org',
        district: 'Regional Surveillance HQ',
        village: 'District Center',
        role: 'admin',
        status: 'approved',
        passwordHash: adminHash,
        salt: adminSalt,
        createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
      },
      {
        id: 'usr_farmer_01',
        name: 'Ezekiel Kiprono',
        phone: '+254 712 884 102',
        email: 'ezekiel@farm.co.ke',
        district: 'Kajiado North',
        village: 'Oloolua Ridge',
        role: 'farmer',
        status: 'approved',
        passwordHash: farmerHash,
        salt: farmerSalt,
        createdAt: new Date('2026-02-10T08:00:00Z').toISOString(),
        approvedAt: new Date('2026-02-10T09:30:00Z').toISOString(),
        approvedBy: 'Dr. Kariuki',
      },
      {
        id: 'usr_farmer_02',
        name: 'Beatrice Atieno',
        phone: '+254 733 912 840',
        email: 'beatrice@lakefarms.org',
        district: 'Nakuru South',
        village: 'Njoro Smallholdings',
        role: 'farmer',
        status: 'pending',
        passwordHash: pendingHash,
        salt: pendingSalt,
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        // Strip a UTF-8 byte-order mark that some editors add
        const raw = fs.readFileSync(DB_FILE, 'utf-8').replace(/^﻿/, '');
        return JSON.parse(raw);
      } catch (e) {
        // Never throw away accounts: keep the unreadable file next to the new one
        const backup = `${DB_FILE}.unreadable-${Date.now()}.bak`;
        try {
          fs.copyFileSync(DB_FILE, backup);
          console.warn(`Could not read the database file; saved a copy to ${backup} and started fresh.`, e);
        } catch {
          console.warn('Could not read the database file and could not back it up', e);
        }
      }
    }

    const initial = getInitialData();
    this.saveToFile(initial);
    return initial;
  }

  private saveToFile(dataToSave: DatabaseSchema) {
    try {
      this.ensureDataDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database to disk:', e);
    }
  }

  private persist() {
    this.saveToFile(this.data);
  }

  // --- User operations ---

  findUserByPhoneOrEmail(identifier: string): UserRecord | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find((u) => {
      const pMatch = u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '');
      const eMatch = u.email && u.email.toLowerCase() === clean;
      return pMatch || eMatch;
    });
  }

  findUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getAllFarmers(): UserRecord[] {
    return this.data.users.filter((u) => u.role === 'farmer');
  }

  async registerFarmer(params: {
    name: string;
    phone: string;
    email?: string;
    district: string;
    village: string;
    passwordPlain: string;
  }): Promise<{ user: UserRecord; error?: string }> {
    const existing = this.findUserByPhoneOrEmail(params.phone);
    if (existing) {
      return { user: existing, error: 'A user with this phone number is already registered.' };
    }

    const { hash, salt } = hashPassword(params.passwordPlain);
    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: params.name.trim(),
      phone: params.phone.trim(),
      email: params.email?.trim() || undefined,
      district: params.district.trim(),
      village: params.village.trim(),
      role: 'farmer',
      status: 'pending', // Pending admin approval
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };

    // Create the account in Supabase first: it is the shared database for farmer accounts.
    // If Supabase cannot be reached the farmer is still saved locally (offline-first).
    const remote = await createFarmerInSupabase(newUser, params.passwordPlain);
    if (remote === 'exists') {
      return {
        user: newUser,
        error: 'This phone number is already registered. Try signing in instead.',
      };
    }

    this.data.users.push(newUser);
    this.persist();
    return { user: newUser };
  }

  /**
   * Store (or refresh) a farmer whose account was verified against Supabase but is missing locally.
   */
  /**
   * Add farmers that exist in Supabase but not in the local file. They get an unusable local
   * password hash, so their first sign in is verified by Supabase and the hash is stored then.
   */
  importFarmersFromSupabase(remoteFarmers: SupabaseFarmer[]): number {
    let added = 0;
    for (const remote of remoteFarmers) {
      if (this.findUserById(remote.id) || (remote.phone && this.findUserByPhoneOrEmail(remote.phone))) continue;
      this.data.users.push({
        id: remote.id,
        name: remote.name,
        phone: remote.phone,
        email: remote.email,
        district: remote.district,
        village: remote.village,
        role: 'farmer',
        status: remote.status,
        passwordHash: crypto.randomBytes(32).toString('hex'),
        salt: crypto.randomBytes(16).toString('hex'),
        createdAt: new Date().toISOString(),
        approvedAt: remote.approvedAt,
        approvedBy: remote.approvedBy,
      });
      added++;
    }
    if (added > 0) this.persist();
    return added;
  }

  restoreFarmerFromSupabase(remote: SupabaseFarmer, passwordPlain: string): UserRecord {
    const { hash, salt } = hashPassword(passwordPlain);
    let user = this.findUserById(remote.id);
    if (!user) {
      user = {
        id: remote.id,
        name: remote.name,
        phone: remote.phone,
        email: remote.email,
        district: remote.district,
        village: remote.village,
        role: 'farmer',
        status: remote.status,
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
        approvedAt: remote.approvedAt,
        approvedBy: remote.approvedBy,
      };
      this.data.users.push(user);
    } else {
      user.status = remote.status;
      user.passwordHash = hash;
      user.salt = salt;
    }
    this.persist();
    return user;
  }

  updateFarmerStatus(
    farmerId: string,
    status: 'approved' | 'rejected',
    adminName: string = 'District Admin'
  ): UserRecord | null {
    const user = this.data.users.find((u) => u.id === farmerId && u.role === 'farmer');
    if (!user) return null;

    user.status = status;
    if (status === 'approved') {
      user.approvedAt = new Date().toISOString();
      user.approvedBy = adminName;
    } else {
      user.rejectionReason = 'Registration information could not be verified by district veterinary office.';
    }

    this.persist();

    // Synchronize approval status with Supabase
    updateSupabaseUserStatus(farmerId, status, adminName).catch((err) =>
      console.warn('Supabase status update warning:', err)
    );

    return user;
  }

  // --- Session operations ---

  createSession(userId: string, role: UserRole): string {
    const token = `fw_${crypto.randomBytes(24).toString('hex')}`;
    this.data.sessions.push({
      token,
      userId,
      role,
      createdAt: Date.now(),
    });
    this.persist();
    return token;
  }

  validateSession(token: string): { user: UserRecord; role: UserRole } | null {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;

    const user = this.findUserById(session.userId);
    if (!user) return null;

    return { user, role: session.role };
  }

  removeSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.persist();
  }
}

export const db = new DatabaseManager();
