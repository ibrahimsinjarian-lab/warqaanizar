import { redirect } from 'next/navigation';
import { currentAdmin, supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function sendLink(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) redirect('/admin/login?error=Enter+your+email+address');

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabase = await supabaseServer();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/auth/callback?next=/admin` }
  });

  if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  redirect('/admin/login?sent=1');
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const { user, isAdmin } = await currentAdmin();
  if (user && isAdmin) redirect('/admin');

  return (
    <div className="login">
      <div className="login__card">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Sign in to the editor</h1>
          <p style={{ color: 'var(--mute)', marginTop: '.4rem' }}>
            We send a link to your email. No password to remember.
          </p>
        </div>

        {sent && (
          <div className="note note--ok">
            Check your email. The link signs you straight in, and it works once.
          </div>
        )}
        {error && <div className="note">{error}</div>}

        <form action={sendLink} className="form">
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <button type="submit" className="primary">
            Send me a link
          </button>
        </form>
      </div>
    </div>
  );
}
