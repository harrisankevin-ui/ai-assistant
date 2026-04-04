import { createClient } from '@supabase/supabase-js';

// Fallback values prevent module-load errors during Next.js build-time static analysis.
// At request time, real env vars are always present.
export const supabase = createClient(
  process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
