export default function Flash({ saved, error, note }: { saved?: string; error?: string; note?: string }) {
  if (!saved && !error && !note) return null;
  return (
    <div style={{ display: 'grid', gap: '.6rem', marginBottom: '1.2rem' }}>
      {saved && <div className="note note--ok">{saved}</div>}
      {note && <div className="note">{note}</div>}
      {error && <div className="note">{error}</div>}
    </div>
  );
}
