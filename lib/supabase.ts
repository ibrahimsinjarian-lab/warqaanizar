import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Read only client for the public site. It carries no session, so row level
 * security limits it to published rows. Safe to use during static generation.
 */
export function publicClient() {
  return createClient(url, publishableKey, {
    db: { schema: 'warqaa' },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
