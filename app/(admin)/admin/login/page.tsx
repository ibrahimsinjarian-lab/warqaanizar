import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentAdmin, supabaseServer } from '@/lib/supabase-server';
import { SubmitButton } from '@/components/admin/Pending';

export const dynamic = 'force-dynamic';

/** Supabase's own wording, turned into what to do about it. */
function plain(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password do not match. Check both, or set a new password below.';
  if (/email not confirmed/i.test(message)) return 'This address has not been confirmed yet. Look for the confirmation email, then try again.';
  if (/rate limit|too many/i.test(message)) return 'Too many tries in a short time. Wait a few minutes, then try again.';
  if (/missing_code|expired|code verifier|otp/i.test(message)) return 'That link has expired or was already used. Ask for a new one below.';
  return message;
}

async function signIn(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/admin/login?error=Enter+your+email+and+password');
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase says "Invalid login credentials" for both a wrong password and
    // an address that has no account, which is the right thing to tell people
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/admin');
}

/**
 * Sends a link that signs her in and opens the page for a new password.
 * The answer is the same whether or not the address has an account, so the
 * form cannot be used to find out who the editors are.
 */
async function sendReset(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) redirect('/admin/login?forgot=1&error=Enter+your+email+address');

  const h = await headers();
  const origin = h.get('origin') ?? `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/admin/reset`
  });

  if (error && /rate limit|too many/i.test(error.message)) {
    redirect(`/admin/login?forgot=1&error=${encodeURIComponent(error.message)}`);
  }
  redirect('/admin/login?sent=1');
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string; forgot?: string }>;
}) {
  const { error, sent, forgot } = await searchParams;
  const { user, isAdmin } = await currentAdmin();
  if (user && isAdmin) redirect('/admin');

  return (
    <div className="login">
      <div className="login__card card">
        <div>
          <h1 className="login__title">Sign in to the editor</h1>
          <p className="login__sub">Warqaa Nizar</p>
        </div>

        {error && (
          <div className="note note--bad" role="alert">
            {plain(error)}
          </div>
        )}
        {sent && (
          <div className="note note--ok" role="status">
            If that address belongs to an editor, an email with a link is on its way. The link opens a page to choose a new
            password. It can take a minute to arrive.
          </div>
        )}

        <form action={signIn} className="form">
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" required autoComplete="username" autoFocus={!forgot} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <SubmitButton className="primary" busy="Signing in">
            Sign in
          </SubmitButton>
        </form>

        <details className="drawer" open={Boolean(forgot)}>
          <summary>Forgot your password?</summary>
          <form action={sendReset} className="form">
            <div className="field">
              <label htmlFor="reset-email">Email address</label>
              <input id="reset-email" name="email" type="email" required autoComplete="username" autoFocus={Boolean(forgot)} />
              <small>We send a link to this address. It lets you choose a new password.</small>
            </div>
            <SubmitButton busy="Sending">Send me a link</SubmitButton>
          </form>
        </details>
      </div>
    </div>
  );
}
