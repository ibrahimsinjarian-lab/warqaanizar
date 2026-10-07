import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentAdmin, supabaseServer } from '@/lib/supabase-server';
import { SubmitButton } from '@/components/admin/Pending';

export const metadata: Metadata = { title: 'New password' };
export const dynamic = 'force-dynamic';

/**
 * Where the link from "Forgot your password?" lands. The link has already
 * signed her in, through /auth/callback, so this only needs the new one.
 */

async function setPassword(formData: FormData) {
  'use server';

  const password = String(formData.get('password') ?? '');
  const again = String(formData.get('again') ?? '');

  if (password.length < 8) redirect('/admin/reset?error=Use+at+least+8+characters');
  if (password !== again) redirect('/admin/reset?error=The+two+passwords+are+not+the+same');

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/admin/reset?error=${encodeURIComponent(error.message)}`);

  redirect('/admin');
}

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { user } = await currentAdmin();
  if (!user) redirect('/admin/login?forgot=1&error=expired');

  return (
    <div className="login">
      <div className="login__card card">
        <div>
          <h1 className="login__title">Choose a new password</h1>
          <p className="login__sub">For {user.email}</p>
        </div>

        {error && (
          <div className="note note--bad" role="alert">
            {error}
          </div>
        )}

        <form action={setPassword} className="form">
          <div className="field">
            <label htmlFor="password">New password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus />
            <small>At least 8 characters.</small>
          </div>
          <div className="field">
            <label htmlFor="again">The same again</label>
            <input id="again" name="again" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <SubmitButton className="primary" busy="Saving">
            Save the new password
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
