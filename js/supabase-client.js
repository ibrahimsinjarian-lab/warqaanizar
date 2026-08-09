/*
  js/supabase-client.js
  ─────────────────────────────────────────────────────────────────
  Fill in your Supabase Project URL and anon key below.
  Both are safe to include in client-side code — Row Level Security
  in Supabase ensures that public visitors can only READ data, and
  only the authenticated admin can write.

  Find these values in:
  Supabase Dashboard → Project Settings → API
  ─────────────────────────────────────────────────────────────────
*/

var WARQAA_SUPABASE_URL = 'https://lzaheldwulxbviutgihc.supabase.co';
var WARQAA_SUPABASE_KEY = 'sb_publishable_fh8AjuWy80u_4xYIU8fj2w_0KjQdUkA';

/*
  supabaseClient is available globally after this script loads.
  The @supabase/supabase-js CDN script must be loaded before this file.
*/
var supabaseClient = (typeof supabase !== 'undefined' && WARQAA_SUPABASE_URL.indexOf('YOUR_PROJECT') === -1)
  ? supabase.createClient(WARQAA_SUPABASE_URL, WARQAA_SUPABASE_KEY)
  : null;
