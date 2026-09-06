-- =====================================================================
-- The editor becomes a real one: buttons, headings, quotes, lists,
-- alignment. That produces HTML rather than Markdown symbols.
--
-- Nothing is converted here. Each row says which format it holds, so
-- everything already written keeps working, and anything opened in the
-- new editor is saved as HTML from then on.
--
-- Run after 009_trash_and_slug_history.sql.
-- =====================================================================

alter table warqaa.essays        add column if not exists content_format text not null default 'markdown';
alter table warqaa.designs       add column if not exists content_format text not null default 'markdown';
alter table warqaa.site_settings add column if not exists content_format text not null default 'markdown';

alter table warqaa.essays  drop constraint if exists essays_content_format;
alter table warqaa.essays  add  constraint essays_content_format  check (content_format in ('markdown', 'html'));
alter table warqaa.designs drop constraint if exists designs_content_format;
alter table warqaa.designs add  constraint designs_content_format check (content_format in ('markdown', 'html'));
