-- =====================================================================
-- Bodies are written and stored as Markdown, not as a rich text
-- document. Plain text is easier to edit, easier to translate well,
-- and easier to move somewhere else later.
--
-- The tables are still empty, so the columns are simply replaced.
-- Run this after 001_schema.sql.
-- =====================================================================

alter table warqaa.essays        drop column if exists body;
alter table warqaa.essays        add  column body text not null default '';

alter table warqaa.designs       drop column if exists concept;
alter table warqaa.designs       drop column if exists execution;
alter table warqaa.designs       add  column concept   text not null default '';
alter table warqaa.designs       add  column execution text not null default '';

alter table warqaa.site_settings drop column if exists about;
alter table warqaa.site_settings add  column about text not null default '';

-- The homepage statement and the two portal notes live here too, so the
-- whole front page is editable without a deploy.
alter table warqaa.site_settings add column if not exists essays_note  text;
alter table warqaa.site_settings add column if not exists designs_note text;
alter table warqaa.site_settings add column if not exists location     text;
