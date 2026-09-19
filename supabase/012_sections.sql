-- =====================================================================
-- Projects are built from sections, and each project picks a layout.
--
-- 1. design_sections: as many sections as she likes, each with a heading
--    and text. One row holds both languages side by side, so a section and
--    the pictures attached to it line up on the Arabic and English pages.
-- 2. design_images.section_id: a picture can belong to a section.
-- 3. designs.layout: 'slideshow' (one slideshow beside all the text) or
--    'sections' (each section with its own pictures).
-- 4. Every existing project is converted: its concept becomes the first
--    section and its execution the second. The old columns are kept, so
--    nothing breaks if this runs before the new code is live.
-- 5. The English About text said "Her name, ورقاء". It now says Warqaa.
--
-- Run after 011_images.sql. Safe to run twice.
-- =====================================================================

-- ------------------------------------------------------------- sections

create table if not exists warqaa.design_sections (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null,
  sort        int not null default 0,
  heading_ar  text,
  heading_en  text,
  body_ar     text not null default '',
  body_en     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists design_sections_group_idx on warqaa.design_sections (group_id, sort);

drop trigger if exists design_sections_touch on warqaa.design_sections;
create trigger design_sections_touch before update on warqaa.design_sections
  for each row execute function warqaa.touch_updated_at();

alter table warqaa.design_sections enable row level security;

-- readers see the sections of a project that is live in at least one language
drop policy if exists "anyone reads live sections" on warqaa.design_sections;
create policy "anyone reads live sections" on warqaa.design_sections
  for select using (
    exists (
      select 1 from warqaa.designs d
      where d.group_id = design_sections.group_id
        and d.status = 'published'
        and d.deleted_at is null
    )
  );

drop policy if exists "admins manage sections" on warqaa.design_sections;
create policy "admins manage sections" on warqaa.design_sections
  for all using (warqaa.is_admin()) with check (warqaa.is_admin());

grant select on warqaa.design_sections to anon, authenticated;
grant insert, update, delete on warqaa.design_sections to authenticated;

-- ------------------------------------------------- pictures in sections

alter table warqaa.design_images
  add column if not exists section_id uuid references warqaa.design_sections(id) on delete set null;

-- ---------------------------------------------------------------- layout

alter table warqaa.designs add column if not exists layout text not null default 'slideshow';
alter table warqaa.designs drop constraint if exists designs_layout;
alter table warqaa.designs add constraint designs_layout check (layout in ('slideshow', 'sections'));

-- ------------------------------------------- convert existing projects

-- concept becomes the first section
insert into warqaa.design_sections (group_id, sort, heading_ar, heading_en, body_ar, body_en)
select g.group_id, 0, 'الفكرة', 'The concept',
       coalesce((select d.concept from warqaa.designs d where d.group_id = g.group_id and d.locale = 'ar' limit 1), ''),
       coalesce((select d.concept from warqaa.designs d where d.group_id = g.group_id and d.locale = 'en' limit 1), '')
from (select distinct group_id from warqaa.designs) g
where not exists (select 1 from warqaa.design_sections s where s.group_id = g.group_id);

-- execution becomes the second, when there is any
insert into warqaa.design_sections (group_id, sort, heading_ar, heading_en, body_ar, body_en)
select g.group_id, 1, 'التنفيذ', 'How it was executed',
       coalesce((select d.execution from warqaa.designs d where d.group_id = g.group_id and d.locale = 'ar' limit 1), ''),
       coalesce((select d.execution from warqaa.designs d where d.group_id = g.group_id and d.locale = 'en' limit 1), '')
from (select distinct group_id from warqaa.designs) g
where (select count(*) from warqaa.design_sections s where s.group_id = g.group_id) = 1
  and exists (
    select 1 from warqaa.designs d
    where d.group_id = g.group_id and coalesce(trim(d.execution), '') <> ''
  );

-- --------------------------------------------------------- her name

update warqaa.site_settings
set about = replace(about, 'Her name, ورقاء,', 'Her name, Warqaa,')
where locale = 'en' and about like '%Her name, ورقاء,%';
