-- =====================================================================
-- The parts of the page that were in the original design but had no
-- column to live in: the four words beside the statement, the large
-- about line, the about details, the contact heading, and the cross
-- links at the foot of the essays and designs pages.
--
-- Run after 003_seed_site_copy.sql.
-- =====================================================================

alter table warqaa.site_settings add column if not exists statement_aside  text[] not null default '{}';
alter table warqaa.site_settings add column if not exists about_quote      text;
alter table warqaa.site_settings add column if not exists about_meta       jsonb  not null default '[]'::jsonb;
alter table warqaa.site_settings add column if not exists contact_title    text;
alter table warqaa.site_settings add column if not exists essays_crossnav  text;
alter table warqaa.site_settings add column if not exists designs_crossnav text;
alter table warqaa.site_settings add column if not exists portrait_tag     text;

update warqaa.site_settings set
  statement_aside = array['socially', 'artistically', 'conceptually', 'politically'],
  about_quote     = 'I do not want to be making noise in *different places.* I want to invite people into my own world.',
  about_meta      = '[
    {"label": "based in",     "value": "Baghdad, Iraq"},
    {"label": "studying",     "value": "architecture, Al Nahrain University"},
    {"label": "writing since","value": "2022"}
  ]'::jsonb,
  contact_title    = 'Come in, *the door is open*',
  essays_crossnav  = 'See the designs those essays argue for.',
  designs_crossnav = 'The thinking behind the drawings.',
  portrait_tag     = 'portrait . 2d'
where locale = 'en';

update warqaa.site_settings set
  statement_aside = array['اجتماعياً', 'فنياً', 'مفاهيمياً', 'سياسياً'],
  about_quote     = 'لا أريد أن أصنع ضجيجاً في *أماكن متفرقة.* أريد أن أدعو الناس إلى عالمي.',
  about_meta      = '[
    {"label": "المكان",     "value": "بغداد، العراق"},
    {"label": "الدراسة",    "value": "عمارة، جامعة النهرين"},
    {"label": "تكتب منذ",   "value": "2022"}
  ]'::jsonb,
  contact_title    = 'ادخل، *الباب مفتوح*',
  essays_crossnav  = 'شاهد التصاميم التي تدافع عنها هذه المقالات.',
  designs_crossnav = 'الفكرة التي وراء الرسوم.',
  portrait_tag     = 'صورة . رسم'
where locale = 'ar';
