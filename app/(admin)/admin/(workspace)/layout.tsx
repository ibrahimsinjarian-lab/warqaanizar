import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/supabase-server';
import AdminNav from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, name } = await currentAdmin();

  if (!user) redirect('/admin/login');

  if (!isAdmin) {
    return (
      <div className="login">
        <div className="login__card">
          <h1>Not on the list</h1>
          <p>
            You are signed in as {user.email}, but that address is not an editor of this site. Ask
            for it to be added, then sign in again.
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <nav className="admin__nav">
        <div className="admin__brand">
          Warqaa Nizar
          <small>editor</small>
        </div>
        <AdminNav />
        <div className="admin__foot">
          <span>{name ?? user.email}</span>
          <Link href="/" target="_blank">
            View the site
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </nav>
      <main className="admin__main">{children}</main>
    </div>
  );
}
