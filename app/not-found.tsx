import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#f3ede2', color: '#191512', fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ letterSpacing: '.2em', textTransform: 'uppercase', fontSize: '.7rem', color: '#7d6f60' }}>404</p>
          <h1 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 6vw, 4rem)', margin: '.5rem 0 1.5rem' }}>This page is not here.</h1>
          <Link href="/" style={{ color: '#b0512f' }}>Go back home</Link>
        </div>
      </body>
    </html>
  );
}
