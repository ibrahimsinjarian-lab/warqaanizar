export function StatusPill({ status }: { status: string }) {
  const live = status === 'published';
  return <span className={`pill ${live ? 'pill--live' : 'pill--draft'}`}>{live ? 'live' : 'draft'}</span>;
}

export function TranslationPill({ state }: { state: string }) {
  if (state === 'machine') return <span className="pill pill--machine">needs reading</span>;
  if (state === 'machine_edited') return <span className="pill">translated, edited</span>;
  return null;
}

export function LocalePill({ locale }: { locale: string }) {
  return <span className="pill">{locale === 'ar' ? 'العربية' : 'English'}</span>;
}
