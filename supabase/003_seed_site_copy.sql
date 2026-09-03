-- =====================================================================
-- The words on the front page, in both languages.
-- Taken from Warqaa's own concept document, not invented.
-- She can change any of it later from the editor.
--
-- Run 002_markdown_bodies.sql first.
-- =====================================================================

insert into warqaa.site_settings (
  locale, display_name, roles, location, statement, about,
  marquee, essays_note, designs_note, instagram
) values (
  'en',
  'Warqaa Nizar',
  'writer, designer',
  'Baghdad, Iraq',
  'Not just a place to read or look at pretty designs. A place to reimagine the ways we turn the spaces around us into homes that reflect us.',
  'Warqaa is an essayist and an architecture student at Al Nahrain University in Baghdad. She writes about heritage, equality, and the quiet politics of rooms, and she designs the spaces those essays argue for.

Her name, ورقاء, means dove. The work follows it: something soft carrying something urgent.

I do not want to be making noise in different places. I want to invite people into my own world.',
  array[
    'relationship to heritage',
    'messages of equality',
    'shaping the future, not only surviving it',
    'ideas that stick in peoples heads'
  ],
  'Design psychology, political philosophy, heritage. Pieces meant to stay in your head after you close the tab.',
  'Houses, schools, rooms. Each one shown with its drawings and a note on the concept and how it was executed.',
  'warqaathinks'
)
on conflict (locale) do update set
  display_name = excluded.display_name,
  roles        = excluded.roles,
  location     = excluded.location,
  statement    = excluded.statement,
  about        = excluded.about,
  marquee      = excluded.marquee,
  essays_note  = excluded.essays_note,
  designs_note = excluded.designs_note,
  instagram    = excluded.instagram;

insert into warqaa.site_settings (
  locale, display_name, roles, location, statement, about,
  marquee, essays_note, designs_note, instagram
) values (
  'ar',
  'ورقاء نزار',
  'كاتبة ومصمّمة',
  'بغداد، العراق',
  'ليس مكاناً للقراءة أو للنظر إلى تصاميم جميلة فحسب، بل مكان لإعادة تخيّل الطرق التي نحوّل بها المساحات من حولنا إلى بيوت تشبهنا.',
  'ورقاء كاتبة مقالات وطالبة عمارة في جامعة النهرين ببغداد. تكتب عن الموروث والمساواة وسياسة الغرف الهادئة، وتصمّم المساحات التي تدافع عنها مقالاتها.

اسمها، ورقاء، يعني الحمامة. وعملها يشبه اسمها: شيء لطيف يحمل شيئاً ملحّاً.

لا أريد أن أصنع ضجيجاً في أماكن متفرقة، أريد أن أدعو الناس إلى عالمي.',
  array[
    'علاقتنا بالموروث',
    'رسائل عن المساواة',
    'أن نصنع المستقبل لا أن ننجو منه فقط',
    'أفكار تبقى في رؤوس الناس'
  ],
  'سيكولوجيا التصميم، الفلسفة السياسية، الموروث. نصوص تبقى معك بعد أن تغلق الصفحة.',
  'بيوت ومدارس وغرف. كل مشروع مع رسومه وملاحظة عن الفكرة وكيف نُفّذت.',
  'warqaathinks'
)
on conflict (locale) do update set
  display_name = excluded.display_name,
  roles        = excluded.roles,
  location     = excluded.location,
  statement    = excluded.statement,
  about        = excluded.about,
  marquee      = excluded.marquee,
  essays_note  = excluded.essays_note,
  designs_note = excluded.designs_note,
  instagram    = excluded.instagram;
