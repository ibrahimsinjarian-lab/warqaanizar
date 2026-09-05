-- =====================================================================
-- The old static pages carried one emphasised phrase in a few places:
-- the terracotta "reimagine" in the statement, the italic "different
-- places" in the about line, and the second line of the contact
-- heading. Emphasis is written between asterisks, and a newline breaks
-- the line.
--
-- Run after 006_fix_about_duplicate.sql.
-- =====================================================================

update warqaa.site_settings set
  statement     = 'Not just a place to read or look at pretty designs. A place to *reimagine* the ways we turn the spaces around us into homes that reflect us.',
  contact_title = E'Come in,\n*the door is open*'
where locale = 'en';

update warqaa.site_settings set
  statement     = 'ليس مكاناً للقراءة أو للنظر إلى تصاميم جميلة فحسب، بل مكان *لإعادة تخيّل* الطرق التي نحوّل بها المساحات من حولنا إلى بيوت تشبهنا.',
  contact_title = E'ادخل،\n*الباب مفتوح*'
where locale = 'ar';

-- one essay title carried an italic word on the old site
update warqaa.essays set title = 'The Courtyard Was a *Political* Idea'
where locale = 'en' and slug = 'the-courtyard-was-a-political-idea';

update warqaa.essays set title = 'كان الفناء فكرة *سياسية*'
where locale = 'ar' and slug = 'كان-الفناء-فكرة-سياسية';
