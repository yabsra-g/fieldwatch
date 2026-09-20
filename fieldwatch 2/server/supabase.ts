import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Credentials come from .env only (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY).
export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://fhfbcvfnpafdyabdkknf.supabase.co',
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  secretKey: process.env.SUPABASE_SECRET_KEY || '',
  jwksUrl:
    process.env.SUPABASE_JWKS_URL ||
    'https://fhfbcvfnpafdyabdkknf.supabase.co/auth/v1/.well-known/jwks.json',
};

export const SUPABASE_ENABLED = Boolean(SUPABASE_CONFIG.secretKey && SUPABASE_CONFIG.publishableKey);

if (!SUPABASE_ENABLED) {
  console.warn('Supabase keys missing in .env: farmer accounts will be stored locally only.');
}

const clientOptions = { auth: { autoRefreshToken: false, persistSession: false } };

// Server-side client with elevated privileges (never sent to the browser)
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.secretKey || 'missing-key',
  clientOptions
);

// Client using the publishable key, used only to verify a farmer's password
const supabasePublic: SupabaseClient = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.publishableKey || 'missing-key',
  clientOptions
);

type FarmerStatus = 'pending' | 'approved' | 'rejected';

export interface SupabaseFarmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  district: string;
  village: string;
  status: FarmerStatus;
  approvedAt?: string;
  approvedBy?: string;
}

/** Supabase Auth needs an email, so farmers without one get a stable address built from their phone. */
export function farmerAuthEmail(phone: string, email?: string): string {
  if (email && email.includes('@')) return email.trim().toLowerCase();
  return `farmer_${phone.replace(/[^0-9]/g, '')}@fieldwatch.org`;
}

let warnedMissingTable = false;
function noteTableError(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (!warnedMissingTable) {
    warnedMissingTable = true;
    console.warn(
      `Supabase 'farmer' table not updated (${error.message}). Run supabase/setup.sql in the Supabase SQL editor to enable it. Farmer login is unaffected.`
    );
  }
}

async function findAuthUser(fieldwatchId: string) {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users?.find((u) => u.user_metadata?.fieldwatch_id === fieldwatchId || u.id === fieldwatchId);
}

/**
 * Health check for the live Supabase project: Auth (admin API) and the REST API (todos table).
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  projectUrl: string;
  error?: string;
  authWorking: boolean;
  restWorking: boolean;
}> {
  const result = {
    connected: false,
    projectUrl: SUPABASE_CONFIG.url,
    authWorking: false,
    restWorking: false,
    error: undefined as string | undefined,
  };
  if (!SUPABASE_ENABLED) {
    result.error = 'Supabase keys are not configured';
    return result;
  }
  try {
    const { error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    result.authWorking = !authError;
    if (authError) result.error = authError.message;

    const { error: restError } = await supabaseAdmin
      .from('todos')
      .select('id', { count: 'exact', head: true });
    result.restWorking = !restError;
    if (restError && !result.error) result.error = restError.message;

    result.connected = result.authWorking && result.restWorking;
  } catch (err: any) {
    result.error = err.message || 'Unknown network error';
  }
  return result;
}

/**
 * Create a farmer account in Supabase Auth (the source of truth for passwords) and mirror the
 * profile into the public.farmer table when it has been set up.
 * 'unavailable' means Supabase could not be reached, so the caller can fall back to local storage.
 */
export async function createFarmerInSupabase(
  user: SupabaseFarmer,
  password: string
): Promise<'created' | 'exists' | 'unavailable'> {
  if (!SUPABASE_ENABLED) return 'unavailable';
  try {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: farmerAuthEmail(user.phone, user.email),
      password,
      email_confirm: true,
      user_metadata: {
        fieldwatch_id: user.id,
        name: user.name,
        phone: user.phone,
        district: user.district,
        village: user.village,
      },
      // app_metadata can only be changed with the secret key, so farmers cannot approve themselves
      app_metadata: { role: 'farmer', status: user.status },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) return 'exists';
      console.warn('Supabase createUser failed:', error.message);
      return 'unavailable';
    }
    await upsertFarmerRow(user);
    return 'created';
  } catch (err) {
    console.warn('Supabase unreachable during sign up:', err);
    return 'unavailable';
  }
}

async function upsertFarmerRow(user: SupabaseFarmer) {
  const { error } = await supabaseAdmin.from('farmer').upsert(
    {
      fieldwatch_id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email || null,
      district: user.district,
      village: user.village,
      role: 'farmer',
      status: user.status,
      approved_at: user.approvedAt || null,
      approved_by: user.approvedBy || null,
    },
    { onConflict: 'fieldwatch_id' }
  );
  noteTableError(error);
}

/**
 * Verify a farmer's password against Supabase Auth. Used when the account is not in the local
 * store (for example on a new machine), so sign in works from any copy of the app.
 */
export async function authenticateFarmerWithSupabase(
  identifier: string,
  password: string
): Promise<SupabaseFarmer | null> {
  if (!SUPABASE_ENABLED) return null;
  try {
    const email = identifier.includes('@')
      ? identifier.trim().toLowerCase()
      : farmerAuthEmail(identifier);
    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
    if (error || !data.user) return null;

    const meta = data.user.user_metadata || {};
    const app = data.user.app_metadata || {};
    // Only farmers are restored this way, and status is read from server-controlled app_metadata
    if (app.role && app.role !== 'farmer') return null;
    const status: FarmerStatus = ['approved', 'rejected'].includes(app.status) ? app.status : 'pending';

    return {
      id: meta.fieldwatch_id || data.user.id,
      name: meta.name || 'Farmer',
      phone: meta.phone || (identifier.includes('@') ? '' : identifier.trim()),
      email: identifier.includes('@') ? email : undefined,
      district: meta.district || '',
      village: meta.village || '',
      status,
      approvedAt: app.approvedAt,
      approvedBy: app.approvedBy,
    };
  } catch (err) {
    console.warn('Supabase unreachable during sign in:', err);
    return null;
  }
}

/**
 * Update a farmer's approval status in Supabase (Auth app_metadata and the farmer table).
 */
export async function updateSupabaseUserStatus(
  userId: string,
  status: 'approved' | 'rejected',
  adminName: string = 'District Admin'
): Promise<boolean> {
  if (!SUPABASE_ENABLED) return false;
  try {
    const approvedAt = status === 'approved' ? new Date().toISOString() : undefined;
    const match = await findAuthUser(userId);
    if (match) {
      await supabaseAdmin.auth.admin.updateUserById(match.id, {
        app_metadata: { ...match.app_metadata, role: 'farmer', status, approvedAt, approvedBy: adminName },
      });
    }
    const { error } = await supabaseAdmin
      .from('farmer')
      .update({ status, approved_at: approvedAt || null, approved_by: adminName })
      .eq('fieldwatch_id', userId);
    noteTableError(error);
    return true;
  } catch (err) {
    console.error('Failed to update user status in Supabase:', err);
    return false;
  }
}

/**
 * On start-up, make sure every locally known farmer that already has a Supabase account carries
 * its current status in app_metadata (older accounts stored it in user_metadata).
 */
export async function backfillFarmerStatuses(farmers: SupabaseFarmer[]): Promise<void> {
  if (!SUPABASE_ENABLED) return;
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = data?.users || [];
    for (const farmer of farmers) {
      const email = farmerAuthEmail(farmer.phone, farmer.email);
      const match = users.find(
        (u) => u.user_metadata?.fieldwatch_id === farmer.id || u.email === email
      );
      if (!match || match.app_metadata?.status === farmer.status) continue;
      await supabaseAdmin.auth.admin.updateUserById(match.id, {
        user_metadata: { ...match.user_metadata, fieldwatch_id: farmer.id },
        app_metadata: {
          ...match.app_metadata,
          role: 'farmer',
          status: farmer.status,
          approvedAt: farmer.approvedAt,
          approvedBy: farmer.approvedBy,
        },
      });
    }
  } catch (err) {
    console.warn('Supabase backfill skipped:', err);
  }
}

/**
 * Every farmer account stored in Supabase Auth, so a fresh copy of the app (or one whose local
 * file was lost) can list and approve them. Status comes from server-controlled app_metadata.
 */
export async function listFarmersFromSupabase(): Promise<SupabaseFarmer[]> {
  if (!SUPABASE_ENABLED) return [];
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return (data?.users || [])
      .filter((u) => u.user_metadata?.fieldwatch_id && (!u.app_metadata?.role || u.app_metadata.role === 'farmer'))
      .map((u) => {
        const meta = u.user_metadata || {};
        const app = u.app_metadata || {};
        return {
          id: meta.fieldwatch_id,
          name: meta.name || 'Farmer',
          phone: meta.phone || '',
          email: u.email && !u.email.startsWith('farmer_') && !u.email.endsWith('.local') ? u.email : undefined,
          district: meta.district || '',
          village: meta.village || '',
          status: (['approved', 'rejected'].includes(app.status) ? app.status : 'pending') as FarmerStatus,
          approvedAt: app.approvedAt,
          approvedBy: app.approvedBy,
        };
      });
  } catch (err) {
    console.warn('Could not list farmers from Supabase:', err);
    return [];
  }
}
