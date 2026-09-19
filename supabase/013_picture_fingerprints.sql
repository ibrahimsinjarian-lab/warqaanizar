-- =====================================================================
-- Two fingerprints on every picture, so the same one is never uploaded twice.
--
-- hash:  the exact file. The same file again is simply reused.
-- phash: what the picture looks like, as a 16 by 16 greyscale copy in hex.
--        A resaved, resized or recompressed copy of the same photo looks
--        almost identical at that size, so the editor asks before
--        uploading it again.
--
-- Pictures uploaded before this have no fingerprints and are never
-- matched. Run after 012_sections.sql. Safe to run twice.
--
-- It also repairs covers and layouts that did not carry across languages.
-- =====================================================================

alter table warqaa.media add column if not exists hash  text;
alter table warqaa.media add column if not exists phash text;

create unique index if not exists media_hash_unique on warqaa.media (hash) where hash is not null;
create index if not exists media_recent_idx on warqaa.media (created_at desc);

-- ------------------------------------------------------------ repairs
-- An English version created after its cover was set started without the
-- cover, and without the project's layout. Both are shared by the two
-- languages, so each version takes them from its partner.

update warqaa.essays e
set cover_media_id = o.cover_media_id
from warqaa.essays o
where e.group_id = o.group_id and e.id <> o.id
  and e.cover_media_id is null and o.cover_media_id is not null;

update warqaa.designs d
set cover_media_id = o.cover_media_id
from warqaa.designs o
where d.group_id = o.group_id and d.id <> o.id
  and d.cover_media_id is null and o.cover_media_id is not null;

-- the Arabic version is the source, so its layout wins
update warqaa.designs d
set layout = o.layout
from warqaa.designs o
where d.group_id = o.group_id and d.locale = 'en' and o.locale = 'ar'
  and d.layout <> o.layout;
