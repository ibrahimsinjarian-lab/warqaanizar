import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * The editor writes as the signed in person, so row level security decides
 * what is allowed. There is no service key anywhere in this app: someone
 * who is not on the admin list simply cannot write, whatever the interface
 * lets them click.
 */
export async function supabaseServer() {
  const store = await cookies();

  return createServerClient(url, key, {
    db: { schema: 'warqaa' },
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a server component, where cookies are read only.
          // the session refresh happens in the route handler instead.
        }
      }
    }
  });
}

export function supabaseBrowser() {
  return createBrowserClient(url, key, { db: { schema: 'warqaa' } });
}

/** The signed in person, and whether the allowlist lets them in. */
export async function currentAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  // the policy on this table is the check: a row comes back only for admins
  const { data } = await supabase.from('admins').select('email, name').limit(1);
  return { user, isAdmin: Boolean(data?.length), name: data?.[0]?.name ?? null };
}
