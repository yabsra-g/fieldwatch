import { createClient } from '@supabase/supabase-js';

// Public Supabase credentials for client-side queries
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://fhfbcvfnpafdyabdkknf.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_o4KdoICsdhriydky5k7ABA_Meymmvzg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
