export default function Flash({ saved, error, note }: { saved?: string; error?: string; note?: string }) {
  if (!saved && !error && !note) return null;
  return (
    <div className="flash">
      {saved && (
        <div className="note note--ok" role="status">
          {saved}
        </div>
      )}
      {note && <div className="note">{note}</div>}
      {error && (
        <div className="note note--bad" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
