-- =====================================================================
-- The line "I do not want to be making noise..." was seeded twice: once
-- as the large about heading in 004, and once as the last paragraph of
-- the about text in 003. This drops the duplicate paragraph and keeps
-- the heading.
--
-- Run after 004_restore_page_copy.sql.
-- =====================================================================

update warqaa.site_settings set about =
$md$Warqaa is an essayist and an architecture student at Al Nahrain University in Baghdad. She writes about heritage, equality, and the quiet politics of rooms, and she designs the spaces those essays argue for.

Her name, ورقاء, means dove. The work follows it: something soft carrying something urgent.$md$
where locale = 'en';

update warqaa.site_settings set about =
$md$ورقاء كاتبة مقالات وطالبة عمارة في جامعة النهرين ببغداد. تكتب عن الموروث والمساواة وسياسة الغرف الهادئة، وتصمّم المساحات التي تدافع عنها مقالاتها.

اسمها، ورقاء، يعني الحمامة. وعملها يشبه اسمها: شيء لطيف يحمل شيئاً ملحّاً.$md$
where locale = 'ar';
