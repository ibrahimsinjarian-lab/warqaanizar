import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ED 01. The Supabase library keeps a session alive by refreshing its token
 * on each request, and that has to happen somewhere it can write cookies.
 * Without this, the token expires on Supabase's default hour and nothing
 * renews it: she writes for an hour, presses save, and the write is refused.
 *
 * This runs on the editor and the auth routes only. The public pages are
 * static and have no session to refresh.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  // asking for the user is what performs the refresh, and writes the new cookies
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*', '/preview/:path*', '/ar/preview/:path*']
};
