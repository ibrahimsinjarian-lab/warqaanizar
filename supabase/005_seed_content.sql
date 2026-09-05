-- =====================================================================
-- Starter essays and projects, so the site is not empty while she
-- writes her own. Every row here is a placeholder: delete any of them
-- from the editor and nothing else breaks.
--
-- Each piece exists twice, once in Arabic and once in English, linked
-- by a shared group_id. Arabic is marked as the source.
--
-- Run after 004_restore_page_copy.sql.
-- =====================================================================

-- ---------------------------------------------------------------- essays

insert into warqaa.essays
  (group_id, locale, is_source, translation_state, slug, title, excerpt, body,
   category, tags, status, published_at, reading_minutes)
values

-- 1 -------------------------------------------------------------------
('a1000000-0000-4000-8000-000000000001', 'ar', true,  'human',
 'في-وراثة-غرفة', 'في وراثة غرفة',
 'عن الغرف التي نرثها، وعن العادات التي تعلّمنا إياها قبل أن نعرف أسماءها.',
 $md$لم تختر جدتي الغرفة التي ماتت فيها. ورثتها كما يرث المرء اسم العائلة أو السعال، ثم قضت خمسين عاماً تجعلها تتكلم بلسانها. الرف عند ارتفاع كتفها. الكرسي المائل ثلاث درجات نحو النافذة، لأن العصر يصل من هناك.

نتحدث عن الموروث كأنه يسكن الواجهة وحدها: في الطابوق المشبّك، وفي الخشب المحفور، وفي الشناشيل المائلة فوق شارع لم يعد بحاجة إلى ظل. تلك النسخة من الموروث سهلة الإعجاب وسهلة الهدم، لأنها لا تطلب منا شيئاً سوى التقدير.

الوراثة الأصعب هي التي تحدث في الداخل، في العادات التي تعلّمك إياها الغرفة قبل أن تكبر بما يكفي لتسميتها. فكّر بمن يحق له أن يغلق باباً. فكّر بأي غرفة تأخذ الضوء الجيد وأيها تأخذ ضجيج الشارع.

أدارت جدتي كرسيها ثلاث درجات. هي أصغر فعل تصميم ممكن، وهي أيضاً الحجة كلها: أن المكان الذي سُلّم إليك ليس نهائياً، وأن البيت شيء تظل تكتب إليه.$md$,
 'general', array['موروث', 'سيكولوجيا التصميم'], 'published', '2026-07-14', 6),

('a1000000-0000-4000-8000-000000000001', 'en', false, 'human',
 'on-inheriting-a-room', 'On Inheriting a Room',
 'About the rooms we inherit, and the habits they teach us before we are old enough to name them.',
 $md$My grandmother did not choose the room she died in. She inherited it, the way you inherit a surname or a cough, and then she spent fifty years making it argue on her behalf. The shelf at the height of her shoulder. The chair turned three degrees toward the window, because that is where the afternoon arrives.

We talk about heritage as though it lives in the facade. In the brick screen, the carved wood, the shanasheel leaning out over a street that no longer needs shading. That version of heritage is easy to admire and easy to demolish, because it asks nothing of us except appreciation.

The harder inheritance happens indoors, in the habits a room teaches you before you are old enough to name them. Think about who is allowed to close a door. Think about which room gets the good light and which one gets the noise from the street.

My grandmother turned her chair three degrees. It is the smallest possible act of design and it is also the whole argument: that the space you were handed is not finished, that a home is something you keep writing back to.$md$,
 'general', array['heritage', 'design psychology'], 'published', '2026-07-14', 6),

-- 2 -------------------------------------------------------------------
('a1000000-0000-4000-8000-000000000002', 'ar', true,  'human',
 'كان-الفناء-فكرة-سياسية', 'كان الفناء فكرة سياسية',
 'البيت ذو الفناء رفض أن يرتّب غرفه حسب أهميتها. ثم قلبنا المخطط وبنينا الهرمية في الرسم.',
 $md$في بغداد فعل البيت ذو الفناء شيئاً كريماً نادراً ما ننسبه إليه: رفض أن يصنّف غرفه. كل شيء ينفتح على الهواء نفسه في الوسط، فالغرفة التي أُعطيت لك لم تكن حكماً على قيمتك.

ثم قلبنا المخطط إلى الخارج، ودفعنا الحياة إلى ممر، وبنينا الهرمية بهدوء داخل الرسم. الممر ليس محايداً. هو يقرر من يُمرّ بجانبه.

لست أدعو إلى الحنين. الحنين طريقة لحب الماضي تعفيك من سؤاله. ما أريده أقرب إلى استجواب يُجرى بمودّة: أن نأخذ المخطط الذي ورثناه، ونجد الجملة التي يكررها، ثم نقرر إن كنا ما نزال نوافق عليها.$md$,
 'design', array['فلسفة سياسية', 'عمارة'], 'published', '2026-06-02', 4),

('a1000000-0000-4000-8000-000000000002', 'en', false, 'human',
 'the-courtyard-was-a-political-idea', 'The Courtyard Was a Political Idea',
 'The courtyard house refused to rank its rooms. Then we turned the plan inside out and built a hierarchy into the drawing.',
 $md$In Baghdad the courtyard house did something generous that we rarely credit it for. It refused to rank its rooms. Everything opened onto the same middle air, so the room you were given was not a verdict on your worth.

Then we turned the plan inside out, pushed the living onto a corridor, and quietly built a hierarchy into the drawing. The corridor is not neutral. It decides who is passed by.

I am not arguing for nostalgia. Nostalgia is a way of loving the past that lets you avoid asking it questions. What I want is closer to an interrogation carried out with affection: to take the plan we inherited, find the sentence it is repeating, and decide whether we still agree with it.$md$,
 'design', array['political philosophy', 'architecture'], 'published', '2026-06-02', 4),

-- 3 -------------------------------------------------------------------
('a1000000-0000-4000-8000-000000000003', 'ar', true,  'human',
 'لمن-يُبنى-البيت', 'لمن يُبنى البيت',
 'كل مخطط توزيع، وكل توزيع ادعاء عمّن يستحق الهدوء.',
 $md$كل مخطط هو توزيع، وكل توزيع ادعاء عمّن يستحق الهدوء. حين تكبر عائلة داخل هذا الادعاء لوقت كافٍ، يتوقف عن الظهور كقرار ويبدأ بالظهور كطقس.

اسأل عن الغرفة التي بلا باب. اسأل عن المطبخ الذي وُضع في الخلف لأن العمل الذي يجري فيه لا يُفترض أن يُرى. البيوت تتعلم أن تخفي من تتعب.

المساواة في العمارة ليست شعاراً يُعلّق على الجدار. هي مقاس نافذة، وارتفاع عتبة، وقرار بأن الضوء الأسخى يذهب حيث يجلس أكثر الناس.$md$,
 'design', array['مساواة', 'سيكولوجيا التصميم'], 'published', '2026-05-09', 3),

('a1000000-0000-4000-8000-000000000003', 'en', false, 'human',
 'who-is-a-house-for', 'Who Is a House For',
 'Every plan is a distribution, and every distribution is a claim about who deserves quiet.',
 $md$Every plan is a distribution, and every distribution is a claim about who deserves quiet. When a family grows up inside that claim for long enough, it stops looking like a decision and starts looking like weather.

Ask about the room with no door. Ask about the kitchen pushed to the back, because the work done there is not meant to be seen. Houses learn to hide whoever gets tired.

Equality in architecture is not a slogan hung on a wall. It is the size of a window, the height of a threshold, and a decision that the most generous light goes where the most people sit.$md$,
 'design', array['equality', 'design psychology'], 'published', '2026-05-09', 3),

-- 4 -------------------------------------------------------------------
('a1000000-0000-4000-8000-000000000004', 'ar', true,  'human',
 'الأمل-جدار-حامل', 'الأمل جدار حامل',
 'ليس زينة تُضاف بعد أن يقف البناء. هو ما يمنعه من السقوط.',
 $md$يُقال لنا إن الأمل ترف، شيء يُضاف بعد أن تُحل المسائل الجادة. لكن في أي مبنى، الجدار الحامل ليس الأجمل، بل الذي لولاه لسقط الباقي.

أن تخطط لمدينة يعني أن تفترض أن أحداً سيعيش فيها بعد عشرين عاماً. أن ترسم مدرسة يعني أن تفترض أن الأطفال سيأتون. لا شيء في هذه المهنة ممكن دون هذا الافتراض.

لذلك أرفض أن أعامل الأمل كعاطفة. هو شرط عملي في العمل، مثل مقاومة التربة.$md$,
 'general', array['فلسفة سياسية', 'أمل'], 'published', '2026-04-18', 3),

('a1000000-0000-4000-8000-000000000004', 'en', false, 'human',
 'hope-is-a-load-bearing-wall', 'Hope Is a Load Bearing Wall',
 'Not decoration added once the building stands. The thing that keeps it from falling.',
 $md$We are told that hope is a luxury, something added after the serious matters are settled. But in any building, the load bearing wall is not the prettiest one. It is the one without which the rest comes down.

To plan a city is to assume somebody will live in it in twenty years. To draw a school is to assume the children will arrive. Nothing in this profession is possible without that assumption.

So I refuse to treat hope as a feeling. It is a working condition, like the bearing capacity of the soil.$md$,
 'general', array['political philosophy', 'hope'], 'published', '2026-04-18', 3),

-- 5 -------------------------------------------------------------------
('a1000000-0000-4000-8000-000000000005', 'ar', true,  'human',
 'ما-تحمله-الورقاء', 'ما تحمله الورقاء',
 'اسم يعني الحمامة، وعمل يشبه اسمه: شيء لطيف يحمل شيئاً ملحّاً.',
 $md$اسمي يعني الحمامة. لسنوات ظننت أن هذا يعني اللين وحده، إلى أن انتبهت أن الحمامة في كل قصة قديمة تحمل شيئاً: غصناً، رسالة، خبراً عن ماء انحسر.

اللطف ليس ضد الجدية. هو الطريقة التي يصل بها الشيء الجاد إلى من يحتاجه دون أن يجرحه.

هكذا أريد أن يعمل هذا المكان. لا ضجيج في أماكن متفرقة، بل دعوة إلى الدخول.$md$,
 'general', array['موروث', 'لغة'], 'published', '2026-03-05', 2),

('a1000000-0000-4000-8000-000000000005', 'en', false, 'human',
 'what-the-dove-carries', 'What the Dove Carries',
 'A name that means dove, and work that follows it: something soft carrying something urgent.',
 $md$My name means dove. For years I thought that meant softness only, until I noticed that in every old story the dove is carrying something: a branch, a message, news of a water that has gone down.

Gentleness is not the opposite of seriousness. It is the way a serious thing reaches the person who needs it without cutting them on the way in.

That is how I want this place to work. Not noise in different places, but an invitation to come in.$md$,
 'general', array['heritage', 'language'], 'published', '2026-03-05', 2);


-- --------------------------------------------------------------- designs

insert into warqaa.designs
  (group_id, locale, is_source, translation_state, slug, title, summary,
   concept, execution, kind, category, spec_place, spec_year, spec_status,
   status, published_at)
values

-- 1 -------------------------------------------------------------------
('d2000000-0000-4000-8000-000000000001', 'ar', true,  'human',
 'دراسة-شناشيل', 'دراسة شناشيل',
 'بيت يستعير فكرة واحدة من واجهات النهر القديمة: أن الجدار يمكن أن يكون مكاناً للجلوس داخله.',
 $md$لم تكن الشناشيل زخرفة فقط. كانت غرفة تُدفع فوق الشارع كي تراقب العائلة المدينة دون أن تُراقَب، وكي يجد الهواء الحار مخرجاً. يحتفظ المشروع بهذا المنطق ويترك الحنين.

يُثخَّن المشبّك حتى يصير أثاثاً: مقعداً، ورفاً، ومكاناً لترك فنجان. كل فتحة يحدد قياسها الغرض منها لا التماثل.$md$,
 $md$بناء بطابوق حامل مع مشبّك خشبي نُفّذ في ورشة بالكرادة. حُددت فراغات المشبّك في الموقع، مرة واحدة، في تموز، بالوقوف داخله في الثانية بعد الظهر وإغلاق الفتحات حتى توقف الوهج.

الرسومات تقترح إيقاعاً. الحرّ وحده يصادق عليه.$md$,
 'بيت', 'architectural', 'بغداد', '2026', 'دراسة', 'published', '2026-07-01'),

('d2000000-0000-4000-8000-000000000001', 'en', false, 'human',
 'shanasheel-study', 'Shanasheel Study',
 'A house that borrows one idea from the old river facades: that a wall can be a place to sit inside.',
 $md$The shanasheel was never only decoration. It was a room pushed out over the street so that a family could watch the city without being watched back, and so that hot air had somewhere to go. The project keeps that logic and drops the nostalgia.

The screen is thickened until it becomes furniture: a seat, a shelf, a place to leave a cup. Every opening is sized by what it is for rather than by symmetry.$md$,
 $md$Built in a load bearing brick with a timber lattice fabricated by a workshop in Karrada. The lattice spacing was set on site, once, in July, by standing inside it at two in the afternoon and closing the gaps until the glare stopped.

Drawings can propose a rhythm. Only the heat can approve it.$md$,
 'house', 'architectural', 'Baghdad', '2026', 'Study', 'published', '2026-07-01'),

-- 2 -------------------------------------------------------------------
('d2000000-0000-4000-8000-000000000002', 'ar', true,  'human',
 'مدرسة-بلا-ممرات', 'مدرسة بلا ممرات',
 'إذا كان الممر يقرر من يُمرّ بجانبه، فماذا يحدث حين نحذفه؟',
 $md$الممر المدرسي مكان يتعلم فيه الأطفال من هو مرئي ومن ليس كذلك. المشروع يحذفه ويضع مكانه سلسلة من الأفنية الصغيرة، كل صف يفتح على واحد منها.

لا يوجد ظهر للمبنى، ولا صف في النهاية.$md$,
 $md$هيكل خرساني بسيط مع جدران طابوق مشبّك تسمح بمرور الهواء بين الأفنية. الأسقف مائلة إلى الداخل لجمع الظل عند منتصف النهار.$md$,
 'مدرسة', 'architectural', 'بغداد', '2026', 'مقترح', 'published', '2026-05-20'),

('d2000000-0000-4000-8000-000000000002', 'en', false, 'human',
 'a-school-without-corridors', 'A School Without Corridors',
 'If a corridor decides who is passed by, what happens when you remove it?',
 $md$A school corridor is where children learn who is visible and who is not. The project removes it and puts a chain of small courtyards in its place, with every classroom opening onto one of them.

The building has no back, and there is no classroom at the end.$md$,
 $md$A simple concrete frame with perforated brick walls that let air move between the courtyards. The roofs slope inward to gather shade in the middle of the day.$md$,
 'school', 'architectural', 'Baghdad', '2026', 'Proposal', 'published', '2026-05-20'),

-- 3 -------------------------------------------------------------------
('d2000000-0000-4000-8000-000000000003', 'ar', true,  'human',
 'غرفة-لقارئ-واحد', 'غرفة لقارئ واحد',
 'أصغر مشروع ممكن: مقعد، ورف، وضوء يصل في الوقت الصحيح.',
 $md$طُلبت الغرفة لشخص واحد يقرأ ساعتين كل مساء. كل قرار فيها يتبع هذا: ارتفاع المقعد، وزاوية الرف، وموضع النافذة التي تدخل منها الشمس عند الخامسة.

الغرفة الصغيرة ليست مشروعاً صغيراً. هي المكان الذي لا يمكن إخفاء الخطأ فيه.$md$,
 $md$خشب محلي وجص مصقول باليد. لا إنارة علوية إطلاقاً: مصباحان فقط، واحد للقراءة وواحد للجدار.$md$,
 'ديكور غرفة', 'interior', 'بغداد', '2025', 'منفّذ', 'published', '2026-02-11'),

('d2000000-0000-4000-8000-000000000003', 'en', false, 'human',
 'room-for-one-reader', 'Room for One Reader',
 'The smallest possible project: a seat, a shelf, and light that arrives at the right hour.',
 $md$The room was asked for by one person who reads for two hours every evening. Every decision follows from that: the height of the seat, the angle of the shelf, and the position of the window the sun comes through at five.

A small room is not a small project. It is the place where a mistake cannot be hidden.$md$,
 $md$Local timber and hand polished plaster. No overhead lighting at all: two lamps only, one for the reading and one for the wall.$md$,
 'room decor', 'interior', 'Baghdad', '2025', 'Built', 'published', '2026-02-11'),

-- 4 -------------------------------------------------------------------
('d2000000-0000-4000-8000-000000000004', 'ar', true,  'human',
 'كرسيان-متقابلان', 'كرسيان متقابلان',
 'ترتيب أثاث يعامل الحديث كوظيفة معمارية.',
 $md$أغلب غرف الجلوس مرتبة نحو التلفاز. هذه مرتبة نحو شخص آخر. كرسيان يتقابلان بزاوية تسمح بالنظر وتسمح أيضاً بالنظر بعيداً.

المسافة بينهما ليست عشوائية: متر وعشرون، وهي أقرب مسافة يمكن أن يصمت فيها اثنان دون حرج.$md$,
 $md$إعادة تنجيد لكرسيين موروثين، مع طاولة صغيرة أُضيفت بينهما بارتفاع الذراع.$md$,
 'ديكور غرفة', 'interior', 'بغداد', '2025', 'منفّذ', 'published', '2026-01-08'),

('d2000000-0000-4000-8000-000000000004', 'en', false, 'human',
 'two-chairs-facing', 'Two Chairs Facing',
 'A furniture arrangement that treats conversation as an architectural function.',
 $md$Most sitting rooms are arranged toward a television. This one is arranged toward another person. Two chairs face each other at an angle that allows looking, and also allows looking away.

The distance between them is not arbitrary: one metre twenty, the closest two people can sit in silence without it becoming awkward.$md$,
 $md$Two inherited chairs, reupholstered, with a small table added between them at the height of an arm.$md$,
 'room decor', 'interior', 'Baghdad', '2025', 'Built', 'published', '2026-01-08');
