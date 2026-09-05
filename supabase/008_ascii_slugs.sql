-- =====================================================================
-- Arabic characters in a slug are legal but troublesome: the browser
-- sends them percent encoded, so a shared link reads
-- /ar/essays/%D9%81%D9%8A-%D9%88%D8%B1%D8%A7%D8%AB%D8%A9 rather than
-- anything a person can read, and the prerendered route no longer
-- matches the incoming path.
--
-- Each Arabic piece now uses the same slug as its English counterpart,
-- so /essays/x and /ar/essays/x are the same piece in two languages.
-- The titles on the page stay Arabic; only the address changes.
--
-- Run after 007_emphasis_and_breaks.sql.
-- =====================================================================

update warqaa.essays set slug = 'on-inheriting-a-room'                where locale = 'ar' and slug = 'في-وراثة-غرفة';
update warqaa.essays set slug = 'the-courtyard-was-a-political-idea'  where locale = 'ar' and slug = 'كان-الفناء-فكرة-سياسية';
update warqaa.essays set slug = 'who-is-a-house-for'                  where locale = 'ar' and slug = 'لمن-يُبنى-البيت';
update warqaa.essays set slug = 'hope-is-a-load-bearing-wall'         where locale = 'ar' and slug = 'الأمل-جدار-حامل';
update warqaa.essays set slug = 'what-the-dove-carries'               where locale = 'ar' and slug = 'ما-تحمله-الورقاء';

update warqaa.designs set slug = 'shanasheel-study'          where locale = 'ar' and slug = 'دراسة-شناشيل';
update warqaa.designs set slug = 'a-school-without-corridors' where locale = 'ar' and slug = 'مدرسة-بلا-ممرات';
update warqaa.designs set slug = 'room-for-one-reader'        where locale = 'ar' and slug = 'غرفة-لقارئ-واحد';
update warqaa.designs set slug = 'two-chairs-facing'          where locale = 'ar' and slug = 'كرسيان-متقابلان';

-- Guard rail: keep slugs to characters that survive a URL untouched.
alter table warqaa.essays  drop constraint if exists essays_slug_ascii;
alter table warqaa.essays  add  constraint essays_slug_ascii  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table warqaa.designs drop constraint if exists designs_slug_ascii;
alter table warqaa.designs add  constraint designs_slug_ascii check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
