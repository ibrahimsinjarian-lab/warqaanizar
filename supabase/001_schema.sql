-- =====================================================================
-- Warqaa Nizar . content schema
-- Run this in the Supabase SQL editor. It creates a new schema called
-- warqaa and touches nothing that already exists in public, so the old
-- site keeps running while the new one is built.
--
-- After running it, go to Project Settings, API, and add "warqaa" to the
-- list of exposed schemas.
-- =====================================================================

create schema if not exists warqaa;

grant usage on schema warqaa to anon, authenticated;


-- ---------------------------------------------------------------------
-- Who may sign in to the editor
-- ---------------------------------------------------------------------

create table warqaa.admins (
  email     text primary key,
  name      text,
  added_at  timestamptz not null default now()
);

-- security definer so the check itself is never blocked by policies
create or replace function warqaa.is_admin()
returns boolean
language sql
stable
security definer
set search_path = warqaa, public
as $$
  select exists (
    select 1 from warqaa.admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;


-- ---------------------------------------------------------------------
-- Uploaded images, shared by both languages
-- ---------------------------------------------------------------------

create table warqaa.media (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,        -- object path inside the storage bucket
  alt_ar      text,
  alt_en      text,
  width       int,
  height      int,
  bytes       int,
  mime        text,
  created_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- Essays. One row per language version.
--
-- group_id links the Arabic row and its English counterpart. Arabic is
-- normally the source: saving an Arabic essay creates or refreshes an
-- English row with translation_state 'machine', held as a draft until
-- she reviews it. An English essay written from scratch is its own
-- source and gets no Arabic counterpart.
-- ---------------------------------------------------------------------

create table warqaa.essays (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null default gen_random_uuid(),
  locale            text not null check (locale in ('ar', 'en')),
  is_source         boolean not null default true,
  translation_state text not null default 'original'
                    check (translation_state in ('original', 'machine', 'machine_edited', 'human')),
  translated_at     timestamptz,
  reviewed_at       timestamptz,

  slug              text not null,
  title             text not null,
  excerpt           text,
  body              jsonb not null default '{"type":"doc","content":[]}'::jsonb,

  category          text not null default 'general' check (category in ('general', 'design')),
  tags              text[] not null default '{}',
  cover_media_id    uuid references warqaa.media(id) on delete set null,

  status            text not null default 'draft' check (status in ('draft', 'published')),
  published_at      timestamptz,
  reading_minutes   int,

  seo_title         text,
  seo_description   text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (locale, slug),
  unique (group_id, locale)
);

create index essays_group_idx     on warqaa.essays (group_id);
create index essays_listing_idx   on warqaa.essays (locale, status, published_at desc);
create index essays_category_idx  on warqaa.essays (category);


-- ---------------------------------------------------------------------
-- Designs. Same pairing rule as essays.
-- ---------------------------------------------------------------------

create table warqaa.designs (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null default gen_random_uuid(),
  locale            text not null check (locale in ('ar', 'en')),
  is_source         boolean not null default true,
  translation_state text not null default 'original'
                    check (translation_state in ('original', 'machine', 'machine_edited', 'human')),
  translated_at     timestamptz,
  reviewed_at       timestamptz,

  slug              text not null,
  title             text not null,
  summary           text,
  concept           jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  execution         jsonb not null default '{"type":"doc","content":[]}'::jsonb,

  kind              text,        -- house, school, room decor, public room
  category          text not null default 'interior' check (category in ('interior', 'architectural')),
  spec_place        text,
  spec_year         text,
  spec_status       text,

  cover_media_id    uuid references warqaa.media(id) on delete set null,

  status            text not null default 'draft' check (status in ('draft', 'published')),
  published_at      timestamptz,

  seo_title         text,
  seo_description   text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (locale, slug),
  unique (group_id, locale)
);

create index designs_group_idx    on warqaa.designs (group_id);
create index designs_listing_idx  on warqaa.designs (locale, status, published_at desc);


-- ---------------------------------------------------------------------
-- The scattered plates on a project page.
-- Attached to the group, not to one language, so an image is uploaded
-- once and both versions of the page show it. Captions are per language.
-- ---------------------------------------------------------------------

create table warqaa.design_images (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null,
  media_id    uuid not null references warqaa.media(id) on delete cascade,
  caption_ar  text,
  caption_en  text,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create index design_images_group_idx on warqaa.design_images (group_id, sort);


-- ---------------------------------------------------------------------
-- Everything on the site that is not an essay or a project.
-- One row per language, so fixing a phone number never needs a deploy.
-- ---------------------------------------------------------------------

create table warqaa.site_settings (
  locale        text primary key check (locale in ('ar', 'en')),
  display_name  text,
  roles         text,
  statement     text,
  about         jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  marquee       text[] not null default '{}',
  email         text,
  whatsapp      text,
  instagram     text,
  ui            jsonb not null default '{}'::jsonb,   -- navigation and button labels
  updated_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------

create or replace function warqaa.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger essays_touch    before update on warqaa.essays        for each row execute function warqaa.touch_updated_at();
create trigger designs_touch   before update on warqaa.designs       for each row execute function warqaa.touch_updated_at();
create trigger settings_touch  before update on warqaa.site_settings for each row execute function warqaa.touch_updated_at();


-- ---------------------------------------------------------------------
-- Row level security.
-- Readers see published rows. Admins see and change everything.
-- ---------------------------------------------------------------------

alter table warqaa.admins        enable row level security;
alter table warqaa.media         enable row level security;
alter table warqaa.essays        enable row level security;
alter table warqaa.designs       enable row level security;
alter table warqaa.design_images enable row level security;
alter table warqaa.site_settings enable row level security;

create policy "admins read the allowlist" on warqaa.admins
  for select using (warqaa.is_admin());
create policy "admins manage the allowlist" on warqaa.admins
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

create policy "anyone reads media" on warqaa.media
  for select using (true);
create policy "admins manage media" on warqaa.media
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

create policy "anyone reads published essays" on warqaa.essays
  for select using (status = 'published');
create policy "admins manage essays" on warqaa.essays
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

create policy "anyone reads published designs" on warqaa.designs
  for select using (status = 'published');
create policy "admins manage designs" on warqaa.designs
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

create policy "anyone reads design images" on warqaa.design_images
  for select using (true);
create policy "admins manage design images" on warqaa.design_images
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

create policy "anyone reads settings" on warqaa.site_settings
  for select using (true);
create policy "admins manage settings" on warqaa.site_settings
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

grant select on all tables in schema warqaa to anon, authenticated;
grant insert, update, delete on all tables in schema warqaa to authenticated;


-- ---------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------

insert into warqaa.admins (email, name) values
  ('warqaa@sinjarian.com', 'Warqaa Nizar');

insert into warqaa.site_settings (locale, display_name, roles, instagram) values
  ('ar', 'ورقاء نزار', 'كاتبة ومصمّمة', 'warqaathinks'),
  ('en', 'Warqaa Nizar', 'writer, designer', 'warqaathinks');
