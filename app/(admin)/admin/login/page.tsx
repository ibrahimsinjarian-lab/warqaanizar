import { redirect } from 'next/navigation';
import { currentAdmin, supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

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

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { user, isAdmin } = await currentAdmin();
  if (user && isAdmin) redirect('/admin');

  return (
    <div className="login">
      <div className="login__card">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Sign in to the editor</h1>
          <p style={{ color: 'var(--mute)', marginTop: '.4rem' }}>Warqaa Nizar</p>
        </div>

        {error && <div className="note">{error}</div>}

        <form action={signIn} className="form">
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" required autoComplete="username" autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="primary">
            Sign in
          </button>
        </form>

        <p style={{ color: 'var(--mute)', fontSize: '.85rem', margin: 0 }}>
          Forgotten it? It can be changed from the Supabase dashboard, under Authentication, Users.
        </p>
      </div>
    </div>
  );
}
