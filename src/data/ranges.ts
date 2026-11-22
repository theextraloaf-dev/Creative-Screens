/* What each range of a service is, and the kinds of thing it covers ("types"), for the range pages
   (/services/<service>/<range>/): a short explanation of the range, then every type with a photo, a line on
   what it is and a "Get a quote". The ranges and their order follow dlxprint.com's catalogue where it matches
   what Creative Screens makes (their photos are not used: they carry dlxprint's watermark or their clients'
   branding). Range names are the services' `makes` in the dictionaries, in the order of sub-categories.ts.
   A type's photo is a free stock photo (src/data/range-photos.ts); a type without one shows as a text card.
   Key: `${service}/${range}`. */

export interface Bi { en: string; ar: string }
export interface RangeType { slug: string; name: Bi; line: Bi }
export interface RangeInfo { intro: Bi; types: RangeType[] }

const t = (slug: string, en: string, ar: string, lineEn: string, lineAr: string): RangeType =>
  ({ slug, name: { en, ar }, line: { en: lineEn, ar: lineAr } });
const r = (en: string, ar: string, types: RangeType[] = []): RangeInfo => ({ intro: { en, ar }, types });

export const ranges: Record<string, RangeInfo> = {
  /* ---------------------------------------------------------------- print & stationery */
  'print-stationery/stationery': r(
    'Everything your office needs with your name on it, printed on good paper and matched across the whole set.',
    'كل ما يحتاجه مكتبك باسمك، مطبوع على ورق جيد ومتناسق في المجموعة كلها.', [
      t('business-cards', 'Business cards', 'بطاقات العمل', 'Matt, gloss or soft-touch, with foil, spot UV or rounded corners if you want them.', 'مطفأة أو لامعة أو بملمس ناعم، مع طباعة ذهبية أو ورنيش بارز أو زوايا مستديرة عند الطلب.'),
      t('letterheads', 'Letterheads', 'الأوراق الرسمية', 'Your letterhead on 100–120 gsm paper that runs through an office printer.', 'ورق رسمي بشعارك بسماكة 100–120 غرام يصلح لطابعات المكتب.'),
      t('envelopes', 'Envelopes', 'الأظرف', 'DL, C5 and C4 envelopes printed with your logo and return address.', 'أظرف بمقاسات DL وC5 وC4 مطبوعة بشعارك وعنوانك.'),
      t('folders', 'Presentation folders', 'ملفات العروض', 'Pocket folders that hold proposals, with a slot for your business card.', 'ملفات بجيب لحفظ العروض، مع فتحة لبطاقة العمل.'),
      t('notepads', 'Notepads', 'المفكرات', 'Glued pads in A4, A5 and A6 for desks, meetings and hotel rooms.', 'مفكرات ملصوقة بمقاسات A4 وA5 وA6 للمكاتب والاجتماعات وغرف الفنادق.'),
      t('certificates', 'Certificates', 'الشهادات', 'Certificates on heavy card, with gold foil or an embossed seal.', 'شهادات على ورق مقوّى، مع طباعة ذهبية أو ختم بارز.'),
      t('calendars', 'Calendars', 'التقاويم', 'Wall and desk calendars with your photos and dates through the year.', 'تقاويم حائط ومكتب بصورك ومناسباتك طوال العام.'),
      t('hang-tags', 'Hang tags', 'بطاقات التعليق', 'Swing tags for clothing and products, punched and strung.', 'بطاقات تعليق للملابس والمنتجات، مثقوبة ومع خيط.'),
    ]),
  'print-stationery/brochures': r(
    'Print that tells people what you sell: folded, stapled or bound, from fifty copies to thousands.',
    'مطبوعات تعرّف الناس بما تبيعه: مطوية أو مدبّسة أو مجلّدة، من خمسين نسخة إلى الآلاف.', [
      t('brochures', 'Brochures', 'المطويات', 'Bi-fold and tri-fold brochures on gloss or matt art paper.', 'مطويات بطيّتين أو ثلاث على ورق لامع أو مطفأ.'),
      t('flyers', 'Flyers', 'النشرات الإعلانية', 'Single sheets, one or two sides, for handouts, mailers and counters.', 'أوراق مفردة بوجه أو وجهين للتوزيع والبريد والكاونترات.'),
      t('catalogues', 'Booklets & catalogues', 'الكتيّبات والكتالوجات', 'Stapled or perfect-bound catalogues, company profiles and reports.', 'كتالوجات وملفات تعريف وتقارير بتدبيس أو تجليد حراري.'),
      t('menus', 'Menu cards', 'قوائم الطعام', 'Restaurant menus, laminated or on heavy card, that stand up to daily use.', 'قوائم مطاعم مغلّفة أو على ورق مقوّى تتحمّل الاستخدام اليومي.'),
    ]),
  'print-stationery/stickers-labels': r(
    'Stickers cut to any shape you like, on paper, vinyl or clear film, as singles or on rolls for your packing line.',
    'ملصقات بأي شكل تريده، على ورق أو فينيل أو فيلم شفاف، مفردة أو على لفات لخط التعبئة لديك.', [
      t('die-cut-stickers', 'Die-cut stickers', 'ملصقات مقصوصة بالشكل', 'Cut around your logo or any shape, on white or clear vinyl.', 'مقصوصة حول شعارك أو أي شكل، على فينيل أبيض أو شفاف.'),
      t('clear-stickers', 'Clear stickers', 'ملصقات شفافة', 'Printed on clear film for glass, bottles and packaging.', 'مطبوعة على فيلم شفاف للزجاج والعبوات والتغليف.'),
      t('roll-labels', 'Roll labels', 'ملصقات على لفات', 'Product labels on rolls, ready for hand or machine application.', 'ملصقات منتجات على لفات جاهزة للّصق اليدوي أو الآلي.'),
      t('foil-hologram', 'Foil & hologram stickers', 'ملصقات ذهبية وهولوغرام', 'Gold, silver and holographic stickers for seals and premium packs.', 'ملصقات ذهبية وفضية وهولوغرامية للأختام والعبوات الفاخرة.'),
      t('epoxy-stickers', 'Domed epoxy stickers', 'ملصقات إيبوكسي بارزة', 'Raised, glossy resin stickers for products, keys and equipment.', 'ملصقات بارزة لامعة بطبقة راتنج للمنتجات والمفاتيح والأجهزة.'),
    ]),
  'print-stationery/business-books': r(
    'The everyday paperwork your business runs on: numbered books in duplicate or triplicate, and the stamps to go with them.',
    'الأوراق اليومية التي يقوم عليها عملك: دفاتر مرقّمة بنسختين أو ثلاث، والأختام التي ترافقها.', [
      t('invoice-books', 'Invoice & receipt books', 'دفاتر الفواتير والإيصالات', 'Numbered, carbonless books in duplicate or triplicate.', 'دفاتر مرقّمة بنسخ كربونية مزدوجة أو ثلاثية.'),
      t('vouchers', 'Payment & delivery vouchers', 'سندات الصرف والتسليم', 'Payment, petty-cash, LPO and delivery-order books in your layout.', 'دفاتر سندات صرف وعهدة وأوامر شراء وتسليم بتصميمك.'),
      t('stamps', 'Self-inking stamps', 'الأختام ذاتية الحبر', 'Company stamps with your name, logo and number.', 'أختام الشركة باسمك وشعارك ورقمك.'),
      t('seals', 'Embossing & wax seals', 'الأختام البارزة والشمعية', 'Embossers for certificates and wax seals for invitations.', 'أختام بارزة للشهادات وأختام شمع للدعوات.'),
    ]),
  'print-stationery/promotional-print': r(
    'Small printed pieces that bring customers through your door: coupons, cards and tags for doors, tables and counters.',
    'مطبوعات صغيرة تجلب العملاء إلى بابك: قسائم وبطاقات ومعلّقات للأبواب والطاولات والكاونترات.', [
      t('coupons', 'Tickets & coupons', 'التذاكر والقسائم', 'Numbered, perforated tickets and coupons for events and offers.', 'تذاكر وقسائم مرقّمة ومثقّبة للفعاليات والعروض.'),
      t('scratch-cards', 'Scratch cards', 'بطاقات الخدش', 'Scratch-and-win cards for promotions and draws.', 'بطاقات اخدش واربح للعروض والسحوبات.'),
      t('door-hangers', 'Door hangers', 'معلّقات الأبواب', 'Die-cut hangers for hotels, offers and deliveries.', 'معلّقات مقصوصة للأبواب للفنادق والعروض والتوصيل.'),
      t('tent-cards', 'Table tent cards', 'بطاقات الطاولات', 'Folded cards that stand on tables, counters and reception desks.', 'بطاقات مطوية تقف على الطاولات والكاونترات ومكاتب الاستقبال.'),
    ]),
  'print-stationery/packaging': r(
    'Packaging that makes what you sell look its best: bags, boxes and sleeves printed in your brand.',
    'تغليف يُظهر منتجاتك في أجمل صورة: أكياس وعلب وأغلفة مطبوعة بهويتك.', [
      t('paper-bags', 'Paper & kraft bags', 'أكياس ورقية وكرافت', 'Paper and kraft bags with your logo and rope or twisted handles.', 'أكياس ورقية وكرافت بشعارك، بمقابض حبل أو ملفوفة.'),
      t('product-boxes', 'Product boxes', 'علب المنتجات', 'Folding boxes for products, gifts and food, printed and die-cut.', 'علب قابلة للطي للمنتجات والهدايا والأطعمة، مطبوعة ومقصوصة.'),
      t('sleeves-wraps', 'Sleeves & wraps', 'الأغلفة والأحزمة', 'Printed sleeves and wraps that dress a plain box or tray.', 'أغلفة وأحزمة مطبوعة تكسو العلب والصواني السادة.'),
    ]),

  /* ---------------------------------------------------------------- signage */
  'signage/shop-fronts': r(
    'The sign over your door is the first thing customers see. We build it in our workshop, lit or unlit, and fit it for you.',
    'اللوحة فوق بابك أول ما يراه عملاؤك. نصنعها في ورشتنا، مضيئة أو بلا إضاءة، ونركّبها لك.', [
      t('unlit-3d', 'Unlit 3D signs', 'لوحات بارزة بلا إضاءة', 'Raised letters in acrylic, metal or foam, seen by daylight or a spotlight.', 'حروف بارزة من الأكريليك أو المعدن أو الفوم، تُرى بضوء النهار أو بكشاف.'),
      t('backlit-3d', 'Halo-lit signs', 'لوحات بإضاءة خلفية', 'LEDs behind each letter throw a soft glow onto the wall.', 'إضاءة LED خلف كل حرف تنشر هالة ناعمة على الجدار.'),
      t('frontlit-3d', 'Front-lit 3D signs', 'لوحات بإضاءة أمامية', 'Letters with lit acrylic faces, bright and readable at night.', 'حروف بواجهات أكريليك مضيئة، ساطعة وواضحة ليلاً.'),
      t('spotlit', 'Spot-lit signs', 'لوحات بإضاءة خارجية', 'A sign board lit by lamps or LED bars fixed in front of it.', 'لوحة تضيئها كشافات أو قضبان LED مثبتة أمامها.'),
      t('flex-face', 'Flex-face sign boards', 'لوحات فليكس', 'A printed flex face on a lit frame, for wide fascias.', 'واجهة فليكس مطبوعة على إطار مضيء للواجهات العريضة.'),
      t('push-through', 'Push-through signs', 'لوحات بحروف نافذة', 'Acrylic letters pushed through a cut metal face and lit from inside.', 'حروف أكريليك تنفذ من واجهة معدنية مقصوصة وتُضاء من الداخل.'),
      t('neon', 'Neon signs', 'لوحات النيون', 'LED neon flex bent into words and logos.', 'نيون LED مرن يُشكّل كلمات وشعارات.'),
    ]),
  'signage/3d-letters': r(
    'Letters that stand out from the wall and get noticed. We\'ll help you pick the material that suits your look and your budget.',
    'حروف بارزة تلفت الأنظار. نساعدك في اختيار الخامة التي تناسب مظهرك وميزانيتك.', [
      t('acrylic-letters', 'Acrylic letters', 'حروف أكريليك', 'Laser-cut acrylic in any colour: gloss, mirror or frosted.', 'أكريليك مقصوص بالليزر بأي لون: لامع أو مرآة أو مطفأ.'),
      t('metal-letters', 'Metal letters', 'حروف معدنية', 'Stainless steel, brass or aluminium, brushed or polished.', 'ستانلس ستيل أو نحاس أو ألمنيوم، مصقول أو مخدوش.'),
      t('foam-letters', 'Forex & foam letters', 'حروف فوركس وفوم', 'Light, lower-cost letters for reception walls and events.', 'حروف خفيفة وأقل تكلفة لجدران الاستقبال والفعاليات.'),
      t('wooden-letters', 'Wooden letters', 'حروف خشبية', 'MDF or solid wood, painted or left natural.', 'خشب MDF أو طبيعي، مدهون أو بلونه الأصلي.'),
    ]),
  'signage/lightboxes': r(
    'Lit panels for menus, offers and brand walls that glow day and night. We\'ll help you choose a face that\'s easy to update.',
    'ألواح مضيئة للقوائم والعروض وجدران العلامة تتوهّج ليلاً ونهاراً، ونساعدك في اختيار واجهة يسهل تحديثها.', [
      t('flex-lightbox', 'Flex-face light boxes', 'صناديق إضاءة فليكس', 'Large printed flex faces stretched on a lit frame.', 'واجهات فليكس مطبوعة مشدودة على إطار مضيء.'),
      t('fabric-lightbox', 'Fabric light boxes', 'صناديق إضاءة قماشية', 'Printed fabric that slots into a slim frame and swaps in minutes.', 'قماش مطبوع يُركّب في إطار نحيف ويُستبدل في دقائق.'),
      t('acrylic-lightbox', 'Acrylic light boxes', 'صناديق إضاءة أكريليك', 'Printed or cut acrylic faces, slim and evenly lit.', 'واجهات أكريليك مطبوعة أو مقصوصة، نحيفة ومتساوية الإضاءة.'),
      t('poster-lightbox', 'Poster light boxes', 'صناديق إضاءة للملصقات', 'Snap frames that take a new poster whenever the offer changes.', 'إطارات تُفتح لتغيير الملصق كلما تغيّر العرض.'),
    ]),
  'signage/wayfinding': r(
    'Signs that make visitors feel at home, guiding them from the entrance to the right door.',
    'لوحات تُشعر زوارك بالراحة، وترشدهم من المدخل إلى الباب الصحيح.', [
      t('wall-signs', 'Wall-mounted signs', 'لوحات جدارية', 'Room, floor and department signs fixed to walls and doors.', 'لوحات الغرف والطوابق والأقسام مثبتة على الجدران والأبواب.'),
      t('hanging-signs', 'Hanging signs', 'لوحات معلّقة', 'Signs hung from the ceiling over corridors and open areas.', 'لوحات تتدلّى من السقف فوق الممرات والمساحات المفتوحة.'),
      t('freestanding-wayfinding', 'Freestanding wayfinding', 'لوحات إرشادية قائمة', 'Totems and posts that point the way outdoors and in lobbies.', 'أعمدة ولوحات قائمة ترشد الزوار في الخارج والردهات.'),
      t('directory-signs', 'Directory signs', 'لوحات الدليل', 'Floor and tenant directories for buildings, malls and hospitals.', 'أدلة الطوابق والمستأجرين للمباني والمراكز التجارية والمستشفيات.'),
    ]),
  'signage/name-plates': r(
    'Smaller signs people read up close, on a door, a gate or a desk, made to look just right.',
    'لوحات أصغر تُقرأ عن قرب، على باب أو بوابة أو مكتب، بمظهر أنيق.', [
      t('office-name-plates', 'Office name plates', 'لوحات أسماء المكاتب', 'Acrylic or metal plates for doors and meeting rooms.', 'لوحات أكريليك أو معدن للأبواب وغرف الاجتماعات.'),
      t('home-name-plates', 'Home name plates', 'لوحات أسماء المنازل', 'Weatherproof plates for gates and villa entrances.', 'لوحات مقاومة للطقس للبوابات ومداخل الفلل.'),
      t('desk-name-plates', 'Desk name plates', 'لوحات المكاتب', 'Tabletop plates for reception desks and conferences.', 'لوحات مكتبية لمكاتب الاستقبال والمؤتمرات.'),
    ]),
  'signage/labels-safety': r(
    'Labels for equipment and doors, and the safety signs every site needs to keep people safe.',
    'ملصقات للمعدات والأبواب، ولوحات السلامة التي يحتاجها كل موقع لحماية الناس.', [
      t('equipment-labels', 'Equipment labels', 'ملصقات المعدات', 'Engraved traffolyte, PVC or acrylic labels for panels and assets.', 'ملصقات محفورة من الترافولايت أو PVC أو الأكريليك للّوحات الكهربائية والأصول.'),
      t('metal-labels', 'Metal labels', 'ملصقات معدنية', 'Etched or engraved aluminium and steel tags that last outdoors.', 'بطاقات ألمنيوم أو ستيل محفورة تدوم في الخارج.'),
      t('safety-signs', 'Safety signs', 'لوحات السلامة', 'Fire, hazard and instruction signs, including glow-in-the-dark.', 'لوحات الحريق والمخاطر والتعليمات، ومنها المضيئة في الظلام.'),
    ]),
  'signage/standing-signs': r(
    'Signs that stand on their own and go where you go. No drilling needed.',
    'لوحات تقف بذاتها وتنتقل معك أينما ذهبت، دون حاجة إلى ثقب.', [
      t('a-boards', 'Folding A-boards', 'لوحات A قابلة للطي', 'Two-sided pavement signs that fold flat at closing time.', 'لوحات رصيف بوجهين تُطوى عند الإغلاق.'),
      t('easel-stands', 'Easel stands', 'حوامل اللوحات', 'Printed boards on an easel for welcomes and event notices.', 'لوحات مطبوعة على حامل للترحيب وإعلانات الفعاليات.'),
      t('pipe-stands', 'Metal pipe stands', 'حوامل معدنية', 'A steel frame with a printed panel for lobbies and queues.', 'إطار معدني بلوحة مطبوعة للردهات والطوابير.'),
    ]),

  /* ---------------------------------------------------------------- window, wall, floor & vehicle graphics */
  'graphics/window-film': r(
    'Film for your glass that adds privacy, shows off your brand, or does both.',
    'أفلام لزجاجك تمنحك الخصوصية أو تُبرز علامتك، أو الاثنين معاً.', [
      t('frosted-film', 'Frosted film', 'فيلم مصنفر', 'An etched-glass look for privacy, plain or with your logo cut out.', 'مظهر الزجاج المصنفر للخصوصية، سادة أو بشعار مقصوص.'),
      t('vinyl-lettering', 'Cut vinyl lettering', 'حروف فينيل مقصوصة', 'Opening hours, names and logos cut from coloured vinyl.', 'مواعيد العمل والأسماء والشعارات مقصوصة من فينيل ملوّن.'),
      t('printed-window', 'Printed window graphics', 'ملصقات نوافذ مطبوعة', 'Full-colour prints for shopfronts and promotions.', 'طباعة كاملة الألوان لواجهات المحلات والعروض.'),
      t('one-way-vision', 'One-way vision', 'ملصقات الرؤية من جهة واحدة', 'Perforated film: a graphic outside, a clear view from inside.', 'فيلم مثقّب: تصميم من الخارج ورؤية واضحة من الداخل.'),
      t('decorative-film', 'Decorative & solar films', 'أفلام ديكور وعازلة', 'Patterned, tinted and heat-reducing films for offices and homes.', 'أفلام مزخرفة وملوّنة وعازلة للحرارة للمكاتب والمنازل.'),
      t('static-cling', 'Static cling', 'ملصقات بلا غراء', 'Glue-free film that sticks to glass and peels off clean.', 'فيلم يلتصق بالزجاج دون غراء ويُزال دون أثر.'),
    ]),
  'graphics/wall-murals': r(
    'Bring your walls to life with print or lettering, in offices, shops, cafés and homes.',
    'أضف الحياة إلى جدرانك بالطباعة أو الكتابة، في المكاتب والمحلات والمقاهي والمنازل.', [
      t('wall-lettering', 'Wall lettering', 'حروف جدارية', 'Values, names and quotes cut from vinyl and applied by hand.', 'القيم والأسماء والعبارات مقصوصة من الفينيل ومركّبة يدوياً.'),
      t('wall-stickers', 'Wall stickers & decals', 'ملصقات جدارية', 'Printed stickers cut to shape for feature walls.', 'ملصقات مطبوعة ومقصوصة بالشكل للجدران المميزة.'),
      t('wallpaper', 'Printed wallpaper', 'ورق جدران مطبوع', 'Custom wallpaper printed to the size of your wall.', 'ورق جدران مطبوع حسب مقاس جدارك.'),
      t('canvas-frames', 'Canvas & framed prints', 'لوحات كانفاس ومؤطرة', 'Canvas, acrylic and wooden frames for décor.', 'لوحات كانفاس وأكريليك وإطارات خشبية للديكور.'),
    ]),
  'graphics/floor-graphics': r(
    'Floor stickers that guide, queue and sell, laminated to take busy foot traffic.',
    'ملصقات أرضيات ترشد وتنظّم الطوابير وتبيع، مغلّفة لتتحمّل حركة الأقدام الكثيفة.', [
      t('direction-stickers', 'Direction stickers', 'ملصقات الاتجاهات', 'Arrows, lanes and queue markers for shops and offices.', 'أسهم ومسارات وعلامات طوابير للمحلات والمكاتب.'),
      t('promo-floor', 'Promotional floor stickers', 'ملصقات أرضيات ترويجية', 'Offers and logos on the floor in front of the shelf.', 'عروض وشعارات على الأرض أمام الرفوف.'),
      t('outdoor-floor', 'Outdoor & anti-slip graphics', 'ملصقات خارجية مانعة للانزلاق', 'Rough-textured laminate for pavements and wet areas.', 'تغليف خشن الملمس للأرصفة والمناطق الرطبة.'),
    ]),
  'graphics/fleet-wraps': r(
    'Turn every drive into an advert: from door logos to full wraps on cars, vans, trucks and boats.',
    'اجعل كل مشوار إعلاناً لك: من شعارات الأبواب إلى التغليف الكامل للسيارات والشاحنات والقوارب.', [
      t('door-logos', 'Door logos & lettering', 'شعارات وحروف الأبواب', 'Logo, phone number and website on the doors.', 'الشعار ورقم الهاتف والموقع على الأبواب.'),
      t('half-wrap', 'Half wraps', 'التغليف الجزئي', 'Printed graphics over part of the vehicle.', 'تصاميم مطبوعة على جزء من المركبة.'),
      t('full-wrap', 'Full wraps', 'التغليف الكامل', 'The whole body wrapped in printed vinyl.', 'تغليف الهيكل كاملاً بفينيل مطبوع.'),
      t('car-magnets', 'Car magnets', 'مغناطيس السيارات', 'Magnetic signs that come off after work.', 'لوحات مغناطيسية تُزال بعد العمل.'),
      t('boat-graphics', 'Boat & yacht graphics', 'ملصقات القوارب واليخوت', 'Marine-grade vinyl for names, stripes and logos.', 'فينيل بحري للأسماء والخطوط والشعارات.'),
    ]),

  /* ---------------------------------------------------------------- flags & banners */
  'flags-banners/feather-flags': r(
    'Tall printed flags that dance in the wind and catch every eye outside your shop or event.',
    'أعلام مطبوعة طويلة تتمايل مع الريح وتلفت كل الأنظار أمام محلك أو فعاليتك.', [
      t('sail-flags', 'Sail flags', 'أعلام الشراع', 'The classic curved feather shape.', 'الشكل المنحني الكلاسيكي.'),
      t('teardrop-flags', 'Teardrop flags', 'أعلام القطرة', 'A rounded shape that keeps the message open even in still air.', 'شكل مستدير يُبقي الرسالة ظاهرة حتى دون رياح.'),
      t('rectangle-flags', 'L-shape & blade flags', 'أعلام مستطيلة', 'Straight-edged flags that give the most print area.', 'أعلام بحواف مستقيمة تمنح أكبر مساحة طباعة.'),
      t('flag-bases', 'Flag bases', 'قواعد الأعلام', 'Cross, water and concrete bases for any ground.', 'قواعد متقاطعة ومائية وخرسانية لأي أرضية.'),
    ]),
  'flags-banners/pole-flags': r(
    'Flags for buildings, desks, crowds and national days, printed or sewn with care.',
    'أعلام للمباني والمكاتب والجماهير والأعياد الوطنية، مطبوعة أو مخيطة بعناية.', [
      t('hoisting-flags', 'Hoisting flags', 'أعلام السواري', 'Country and company flags for flagpoles.', 'أعلام الدول والشركات للسواري.'),
      t('building-flags', 'Giant building flags', 'أعلام المباني الضخمة', 'Large flags that hang down building faces for national days.', 'أعلام كبيرة تتدلّى على واجهات المباني في الأعياد الوطنية.'),
      t('table-flags', 'Table & conference flags', 'أعلام الطاولات والمؤتمرات', 'Desk flags and indoor pole flags for meetings.', 'أعلام مكتبية وأعلام سارية داخلية للاجتماعات.'),
      t('hand-flags', 'Hand-waving flags', 'أعلام اليد', 'Small flags for crowds, schools and parades.', 'أعلام صغيرة للجماهير والمدارس والمسيرات.'),
      t('car-flags', 'Car flags', 'أعلام السيارات', 'Window-clip flags for National Day and match days.', 'أعلام تُثبّت على نوافذ السيارات في العيد الوطني والمباريات.'),
      t('bunting', 'Bunting & pennants', 'أعلام الزينة', 'Strings of small flags for decoration.', 'حبال من أعلام صغيرة للزينة.'),
    ]),
  'flags-banners/roll-ups': r(
    'Banner stands that go up in a minute and pack into a bag, ready for your next event.',
    'حوامل بنرات تُنصب في دقيقة وتُحفظ في حقيبة، جاهزة لفعاليتك القادمة.', [
      t('rollup-banners', 'Roll-up banners', 'بنرات رول أب', 'The banner rolls into its base and pulls up on a pole.', 'البنر يلتفّ داخل قاعدته ويُسحب للأعلى على عمود.'),
      t('x-banners', 'X-banners', 'بنرات X', 'A light, low-cost stand with the banner on an X frame.', 'حامل خفيف قليل التكلفة بإطار على شكل X.'),
      t('popout-banners', 'Pop-out banners', 'بنرات قابلة للفتح', 'Spring frames that open in seconds, for floors and counters.', 'إطارات نابضية تُفتح في ثوانٍ للأرضيات والكاونترات.'),
      t('a-frames', 'A-frame & totem stands', 'حوامل A والتوتم', 'Two-sided stands for walkways and entrances.', 'حوامل بوجهين للممرات والمداخل.'),
    ]),
  'flags-banners/large-banners': r(
    'Big prints for building fronts, fences and events, hemmed and eyeleted so they\'re ready to hang.',
    'مطبوعات كبيرة لواجهات المباني والأسوار والفعاليات، بحواف مخيطة وحلقات لتكون جاهزة للتعليق.', [
      t('pvc-banners', 'PVC banners', 'بنرات PVC', 'Weatherproof flex banners for outdoors.', 'بنرات فليكس مقاومة للطقس للاستخدام الخارجي.'),
      t('fabric-banners', 'Fabric banners', 'بنرات قماشية', 'Printed fabric that hangs smooth indoors.', 'قماش مطبوع ينسدل بسلاسة في الداخل.'),
      t('mesh-banners', 'Mesh & fence banners', 'بنرات شبكية وللأسوار', 'Perforated mesh that lets the wind through on sites and fences.', 'شبك مثقّب يمرّر الهواء في المواقع والأسوار.'),
      t('barrier-covers', 'Crowd barrier covers', 'أغطية الحواجز', 'Printed sleeves for barriers at races and events.', 'أغطية مطبوعة للحواجز في السباقات والفعاليات.'),
    ]),

  /* ---------------------------------------------------------------- exhibitions */
  'exhibitions-events/booths': r(
    'A stand that brings visitors to you, whatever the size: from a shell-scheme corner to a full custom booth.',
    'جناح يجذب الزوار إليك مهما كان حجمه: من زاوية في جناح جاهز إلى جناح كامل حسب الطلب.', [
      t('shell-scheme', 'Shell-scheme graphics', 'تجهيز الأجنحة الجاهزة', 'Panels printed and fitted to the organiser\'s shell scheme.', 'ألواح مطبوعة ومركّبة على الجناح الجاهز من المنظّم.'),
      t('modular-booths', 'Modular booths', 'الأجنحة المعيارية', 'Reusable frame systems with printed or backlit fabric.', 'أنظمة إطارات قابلة لإعادة الاستخدام بقماش مطبوع أو مضيء.'),
      t('custom-booths', 'Custom-built booths', 'أجنحة حسب الطلب', 'Designed and built in our workshop around your brand.', 'تُصمَّم وتُبنى في ورشتنا حول علامتك.'),
      t('popup-stands', 'Fabric pop-up stands', 'ستاندات قماشية منبثقة', 'Curved or straight walls that open out of a case.', 'جدران منحنية أو مستقيمة تُفتح من حقيبة.'),
    ]),
  'exhibitions-events/fabrication': r(
    'Custom pieces we build in our own workshop for your stand, store or event.',
    'قطع حسب الطلب نصنعها في ورشتنا لجناحك أو متجرك أو فعاليتك.', [
      t('counters', 'Exhibition counters', 'كاونترات المعارض', 'Branded counters and promotion tables.', 'كاونترات وطاولات ترويجية بعلامتك.'),
      t('display-cubes', 'Display cubes & plinths', 'مكعبات وقواعد العرض', 'Plinths and cubes that lift products to eye level.', 'قواعد ومكعبات ترفع المنتجات إلى مستوى النظر.'),
      t('pos-stands', 'POS display stands', 'حوامل نقاط البيع', 'Floor and shelf displays for retail.', 'حوامل أرضية ورفّية للمتاجر.'),
      t('entrance-arches', 'Entrance arches', 'أقواس المداخل', 'Wooden and printed arches for event entrances.', 'أقواس خشبية ومطبوعة لمداخل الفعاليات.'),
    ]),

  /* ---------------------------------------------------------------- event setup */
  'event-setup/stage-backdrops': r(
    'The wall behind the stage, the stage itself and the photo spot your guests will love.',
    'الجدار خلف المسرح، والمسرح نفسه، وركن التصوير الذي سيحبه ضيوفك.', [
      t('fabric-backdrops', 'Fabric backdrops', 'خلفيات قماشية', 'Tension fabric on a frame, smooth and crease-free.', 'قماش مشدود على إطار، أملس وبلا تجاعيد.'),
      t('step-repeat', 'Step & repeat walls', 'جدران الشعارات للتصوير', 'Logo walls for red carpets and press photos.', 'جدران شعارات للسجادة الحمراء وصور الصحافة.'),
      t('curved-backdrops', 'Curved backdrops', 'خلفيات منحنية', 'Curved fabric walls for stages and lobbies.', 'جدران قماشية منحنية للمسارح والردهات.'),
      t('backlit-backdrops', 'Backlit backdrops', 'خلفيات مضيئة', 'Lit fabric walls that glow on stage.', 'جدران قماشية مضيئة تتوهّج على المسرح.'),
      t('stages', 'Stages & platforms', 'المسارح والمنصات', 'Platforms, steps and skirting built to size.', 'منصات ودرجات وتنانير تُبنى حسب المقاس.'),
    ]),
  'event-setup/event-branding': r(
    'Everything with your event\'s name on it, from the welcome at the entrance to the photo corner.',
    'كل ما يحمل اسم فعاليتك، من الترحيب عند المدخل إلى ركن التصوير.', [
      t('photo-frames', 'Social media frames', 'إطارات التصوير', 'Hand-held frames and hashtag signs for photos.', 'إطارات يدوية ولوحات هاشتاق للتصوير.'),
      t('giant-cheques', 'Giant cheques', 'الشيكات الكبيرة', 'Presentation cheques for awards and donations.', 'شيكات عرض للجوائز والتبرعات.'),
      t('cutout-standees', 'Cut-out standees', 'مجسمات مقصوصة', 'Life-size printed figures and product cut-outs.', 'مجسمات مطبوعة بالحجم الطبيعي ومقصوصات المنتجات.'),
      t('marquee-letters', 'Marquee letters', 'حروف مضيئة كبيرة', 'Light-up letters and numbers for celebrations.', 'حروف وأرقام مضيئة للاحتفالات.'),
      t('tents-gazebos', 'Tents & gazebos', 'الخيام والمظلات', 'Printed pop-up tents and umbrellas for outdoor events.', 'خيام ومظلات مطبوعة للفعاليات الخارجية.'),
      t('table-covers', 'Table covers', 'أغطية الطاولات', 'Fitted and throw covers printed with your logo.', 'أغطية مفصّلة ومنسدلة مطبوعة بشعارك.'),
    ]),

  /* ---------------------------------------------------------------- LED screens (types after FineLED's catalogue) */
  'led-screens/indoor-outdoor': r(
    'Bright, sharp screens for inside and out, sized to your wall and to how far away people will be watching.',
    'شاشات ساطعة وواضحة للداخل والخارج، بمقاس جدارك والمسافة التي يُشاهد منها الناس.', [
      t('indoor-led-walls', 'Indoor LED walls', 'جدران LED داخلية', 'Fine-pitch walls for lobbies, showrooms and shops, sharp up close.', 'جدران عالية الدقة للردهات وصالات العرض والمحلات، واضحة عن قرب.'),
      t('outdoor-led-screens', 'Outdoor screens & billboards', 'شاشات ولوحات إعلانية خارجية', 'Weather-rated, high-brightness screens for streets and facades.', 'شاشات عالية السطوع مقاومة للطقس للشوارع والواجهات.'),
      t('stadium-screens', 'Stadium & sports screens', 'شاشات الملاعب والرياضة', 'Big screens and perimeter boards for pitches, courts and fan zones.', 'شاشات كبيرة ولوحات محيطية للملاعب والصالات ومناطق المشجعين.'),
      t('conference-walls', 'Conference & auditorium walls', 'شاشات قاعات المؤتمرات والمسارح', 'Meeting-room and auditorium walls in place of projectors.', 'جدران لقاعات الاجتماعات والمسارح بدلاً من أجهزة العرض.'),
    ]),
  'led-screens/creative-led': r(
    'Screens that bend, wrap and take shapes a flat wall can\'t, for spaces people remember.',
    'شاشات تنحني وتلتف وتأخذ أشكالاً لا يقدر عليها الجدار المسطّح، لمساحات لا تُنسى.', [
      t('curved-flexible', 'Curved & flexible LED', 'شاشات LED منحنية ومرنة', 'Flexible modules that bend round columns, curves and rings.', 'وحدات مرنة تنحني حول الأعمدة والمنحنيات والحلقات.'),
      t('sculptural-3d', '3D & sculptural LED', 'شاشات LED مجسّمة وثلاثية الأبعاد', 'Corner screens, cubes and shapes, with content made to look 3D.', 'شاشات زوايا ومكعبات وأشكال بمحتوى يبدو ثلاثي الأبعاد.'),
    ]),
  'led-screens/rental-events': r(
    'Screens for a day or a season. We deliver them, set them up and run them, so you can enjoy the event.',
    'شاشات ليوم أو لموسم. نوصلها ونركّبها ونشغّلها، لتستمتع أنت بالفعالية.', [
      t('stage-event-screens', 'Stage & event screens', 'شاشات المسارح والفعاليات', 'Rental walls for concerts, launches and conferences, set up and run by our crew.', 'جدران للإيجار للحفلات وإطلاق المنتجات والمؤتمرات، يركّبها ويشغّلها فريقنا.'),
      t('portable-kiosks', 'Portable screens & kiosks', 'شاشات متنقلة وأكشاك رقمية', 'Freestanding digital posters and touch kiosks you can move.', 'ملصقات رقمية قائمة وأكشاك لمس يمكن نقلها.'),
      t('studio-walls', 'Studio & broadcast walls', 'شاشات الاستوديو والبث', 'LED backdrops for TV sets, podcasts and virtual production.', 'خلفيات LED لاستوديوهات التلفزيون والبودكاست والإنتاج الافتراضي.'),
    ]),
  'led-screens/led-signs': r(
    'Small LED signs for messages you want to change often.',
    'لوحات LED صغيرة للرسائل التي تريد تغييرها باستمرار.', [
      t('scrolling-boards', 'Scrolling message boards', 'لوحات رسائل متحركة', 'Programmable message boards for shops, queues and offices.', 'لوحات رسائل قابلة للبرمجة للمحلات والطوابير والمكاتب.'),
      t('small-led-signs', 'Small LED signs', 'لوحات LED صغيرة', 'Open, closed, price and number signs in LED.', 'لوحات LED للفتح والإغلاق والأسعار والأرقام.'),
    ]),
  'led-screens/installation': r(
    'We visit the site, supply the screen, fix it in place and keep it running for you.',
    'نعاين الموقع ونورّد الشاشة ونثبّتها ونحافظ على تشغيلها لك.', [
      t('installation', 'Supply, installation & upkeep', 'التوريد والتركيب والصيانة', 'Survey, supply, mounting, power, content set-up and maintenance.', 'المعاينة والتوريد والتثبيت والتوصيل وإعداد المحتوى والصيانة.'),
    ]),

  /* ---------------------------------------------------------------- gifts (their pages list the catalogue pieces) */
  'gifts-apparel/drinkware': r('Mugs, tumblers and bottles with your logo, printed or engraved, that people use every day.', 'أكواب وكؤوس حرارية وقوارير بشعارك، مطبوعة أو محفورة، يستخدمها الناس كل يوم.'),
  'gifts-apparel/bags-travel': r('Backpacks, totes and pouches your delegates, staff and clients will be glad to carry.', 'حقائب ظهر وحقائب قماشية وأكياس يسعد المشاركون والموظفون والعملاء بحملها.'),
  'gifts-apparel/headwear': r('Caps embroidered or printed for your team and your events.', 'قبعات مطرّزة أو مطبوعة لفريقك وفعالياتك.'),
  'gifts-apparel/technology': r('Speakers, earbuds, chargers and adapters with your brand on them: gifts people actually use.', 'مكبرات صوت وسماعات وشواحن ومحوّلات تحمل علامتك: هدايا يستخدمها الناس فعلاً.'),
  'gifts-apparel/office-writing': r('Notebooks and desk pieces for the office and conferences, keeping your brand close at hand.', 'دفاتر وأدوات مكتبية للمكتب والمؤتمرات، تبقي علامتك قريبة دائماً.'),
  'gifts-apparel/home-living': r('Gifts for the home, with a quiet touch of your brand.', 'هدايا للمنزل بلمسة هادئة من علامتك.'),
  'gifts-apparel/outdoor-recreation': r('Things for the beach, the desert and the weekend, with your brand along for the trip.', 'أغراض للشاطئ والصحراء وعطلة نهاية الأسبوع، ترافقها علامتك في كل رحلة.'),
  'gifts-apparel/culture-gifts': r('Dallah sets and gifts with a local touch, made for welcoming guests and celebrating Eid.', 'دلال وهدايا بلمسة محلية، لاستقبال الضيوف والاحتفال بالعيد.'),

  /* ---------------------------------------------------------------- acrylic & awards */
  'acrylic-awards/laser-cut-acrylic': r(
    'Acrylic cut and engraved on our own laser: clean edges, any shape, any colour you like.',
    'أكريليك يُقصّ ويُحفر بالليزر في ورشتنا: حواف نظيفة وأي شكل وأي لون تحبه.', [
      t('acrylic-logos', 'Acrylic logos & letters', 'شعارات وحروف أكريليك', 'Your logo cut in acrylic for walls, desks and counters.', 'شعارك مقصوصاً من الأكريليك للجدران والمكاتب والكاونترات.'),
      t('acrylic-frames', 'Acrylic photo frames & blocks', 'إطارات وكتل صور أكريليك', 'Clear frames and photo blocks, printed or engraved.', 'إطارات وكتل صور شفافة، مطبوعة أو محفورة.'),
      t('acrylic-boxes', 'Acrylic boxes & cases', 'صناديق وعلب أكريليك', 'Clear boxes for gifts, collections and displays.', 'صناديق شفافة للهدايا والمقتنيات والعرض.'),
    ]),
  'acrylic-awards/plaques': r(
    'Plaques to say thank you for long service, a job well done or a grand opening, engraved with names and dates.',
    'دروع لتقول شكراً على سنوات الخدمة أو عمل متقن أو افتتاح كبير، محفورة بالأسماء والتواريخ.', [
      t('acrylic-plaques', 'Acrylic plaques', 'دروع أكريليك', 'Clear or coloured acrylic, on a stand or for the wall.', 'أكريليك شفاف أو ملوّن، على قاعدة أو للجدار.'),
      t('wood-plaques', 'Wood & metal plaques', 'دروع خشب ومعدن', 'Wooden boards carrying an engraved metal plate.', 'ألواح خشبية تحمل لوحة معدنية محفورة.'),
    ]),
  'acrylic-awards/trophies': r(
    'Trophies and medals that make sports days, staff awards and competitions feel special.',
    'كؤوس وميداليات تجعل الأيام الرياضية وجوائز الموظفين والمسابقات مميّزة.', [
      t('crystal-trophies', 'Crystal trophies', 'كؤوس كريستال', 'Engraved crystal and glass awards in a gift box.', 'جوائز كريستال وزجاج محفورة في علبة هدايا.'),
      t('acrylic-trophies', 'Acrylic trophies', 'كؤوس أكريليك', 'Cut acrylic shapes with your logo, at a lower cost.', 'أشكال أكريليك مقصوصة بشعارك بتكلفة أقل.'),
      t('medals', 'Medals', 'الميداليات', 'Cast or printed medals on ribbons for every finisher.', 'ميداليات مصبوبة أو مطبوعة بأشرطة لكل مشارك.'),
    ]),
  'acrylic-awards/display-stands': r(
    'Clear stands that show off your menus, brochures, signs and products.',
    'حوامل شفافة تُبرز قوائمك ومطوياتك ولوحاتك ومنتجاتك.', [
      t('brochure-holders', 'Brochure holders', 'حوامل المطويات', 'Counter and wall holders for leaflets and catalogues.', 'حوامل كاونتر وجدار للنشرات والكتالوجات.'),
      t('sign-holders', 'Sign & menu holders', 'حوامل اللوحات والقوائم', 'T-stands and L-stands for prices, menus and notices.', 'حوامل على شكل T وL للأسعار والقوائم والإعلانات.'),
      t('product-risers', 'Product risers', 'قواعد رفع المنتجات', 'Steps and blocks that lift products in a display.', 'درجات وكتل ترفع المنتجات في العرض.'),
    ]),
};
