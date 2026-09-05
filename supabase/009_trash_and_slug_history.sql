-- =====================================================================
-- Two things the editor needs before it can stop losing work.
--
-- 1. A trash, so deleting is reversible.
-- 2. A memory of old addresses, so renaming a published piece does not
--    kill every link anyone has shared.
--
-- Run after 008_ascii_slugs.sql.
-- =====================================================================

-- ---------------------------------------------------------------- trash

alter table warqaa.essays  add column if not exists deleted_at timestamptz;
alter table warqaa.designs add column if not exists deleted_at timestamptz;

create index if not exists essays_alive_idx  on warqaa.essays  (locale, status) where deleted_at is null;
create index if not exists designs_alive_idx on warqaa.designs (locale, status) where deleted_at is null;

-- a piece in the trash leaves the site immediately, whatever its status
drop policy if exists "anyone reads published essays" on warqaa.essays;
create policy "anyone reads published essays" on warqaa.essays
  for select using (status = 'published' and deleted_at is null);

drop policy if exists "anyone reads published designs" on warqaa.designs;
create policy "anyone reads published designs" on warqaa.designs
  for select using (status = 'published' and deleted_at is null);


-- --------------------------------------------------------- old addresses

create table if not exists warqaa.slug_history (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('essays', 'designs')),
  locale      text not null check (locale in ('ar', 'en')),
  old_slug    text not null,
  piece_id    uuid not null,
  created_at  timestamptz not null default now(),
  unique (kind, locale, old_slug)
);

create index if not exists slug_history_lookup on warqaa.slug_history (kind, locale, old_slug);

alter table warqaa.slug_history enable row level security;

-- the public site has to read this to follow an old link
create policy "anyone reads old addresses" on warqaa.slug_history
  for select using (true);

create policy "admins manage old addresses" on warqaa.slug_history
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

grant select on warqaa.slug_history to anon, authenticated;
grant insert, update, delete on warqaa.slug_history to authenticated;
