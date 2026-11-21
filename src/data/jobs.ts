/* Finished jobs for the pinned gallery on /preview/ (docs/superpowers/specs/2026-11-20-clean-light-jobs-gallery-design.md).
   PLACEHOLDERS: every entry is `sample: true` and shows a "Sample" tag until the client sends the real jobs
   (photos, client, place, year). Swap the entries and set `sample: false`; nothing else needs to change.
   Images are the original site's own: the workshop photos, the product catalogue cut-outs and the service plates.
   `look` says how a card frames its image: a photo fills the card; an object (catalogue cut-out on white) and a
   drawing (a line-art plate) sit whole on paper. */

export type Locale = 'en' | 'ar';
export type ServiceSlug =
  | 'print-stationery' | 'signage' | 'graphics' | 'flags-banners' | 'exhibitions-events' | 'led-screens' | 'gifts-apparel' | 'acrylic-awards';
export type Look = 'photo' | 'object' | 'drawing';
export interface JobCopy { title: string; client: string; place: string; line: string }
export interface Job { slug: string; service: ServiceSlug; year: number; sample: boolean; look: Look; photos: string[]; en: JobCopy; ar: JobCopy }

const plate = (s: ServiceSlug) => `/plates/${s}.png`;
const gift = (n: string) => `/gifts/${n}.webp`;
const sub = (cat: string, n: string) => `/subcategories/${cat}/${n}.jpg`;

export const jobs: Job[] = [
  { slug: 'launch-banners', service: 'graphics', year: 2025, sample: true, look: 'photo', photos: ['/services/printer-banner.webp', '/video/hero-poster.jpg'],
    en: { title: 'Banners for a retail launch', client: 'A retail chain', place: 'Muscat', line: 'Printed on our large-format press, finished and hung in a day.' },
    ar: { title: 'لافتات لافتتاح متجر', client: 'سلسلة متاجر', place: 'مسقط', line: 'طُبعت على طابعتنا الكبيرة، وجُهّزت وعُلّقت في يوم واحد.' } },
  { slug: 'shopfront-sign', service: 'signage', year: 2025, sample: true, look: 'drawing', photos: [plate('signage')],
    en: { title: 'A lit shopfront sign', client: 'A café in Muttrah', place: 'Muttrah', line: 'Fascia, lightbox and window lettering.' },
    ar: { title: 'لوحة واجهة مضيئة', client: 'مقهى في مطرح', place: 'مطرح', line: 'لوحة واجهة وصندوق إضاءة وكتابة على الزجاج.' } },
  { slug: 'fleet-wrap', service: 'graphics', year: 2024, sample: true, look: 'drawing', photos: [plate('graphics')],
    en: { title: 'A pick-up fleet in full wrap', client: 'A contracting company', place: 'Muscat', line: 'Twelve vehicles, one look.' },
    ar: { title: 'تغليف كامل لأسطول مركبات', client: 'شركة مقاولات', place: 'مسقط', line: 'اثنتا عشرة مركبة بهوية واحدة.' } },
  { slug: 'staff-caps', service: 'gifts-apparel', year: 2025, sample: true, look: 'object', photos: [sub('gifts-apparel', 'cap-trucker-navy'), gift('cap')],
    en: { title: 'Branded caps for a staff day', client: 'A logistics firm', place: 'Sohar', line: 'Embroidered fronts, three hundred caps.' },
    ar: { title: 'قبعات مطبوعة ليوم الموظفين', client: 'شركة لوجستية', place: 'صحار', line: 'تطريز أمامي لثلاثمئة قبعة.' } },
  { slug: 'led-wall', service: 'led-screens', year: 2025, sample: true, look: 'drawing', photos: [plate('led-screens')],
    en: { title: 'An outdoor screen on a retail tower', client: 'A retail tower', place: 'Al Khuwair', line: 'Bright enough for the midday sun.' },
    ar: { title: 'شاشة خارجية على برج تجاري', client: 'برج تجاري', place: 'الخوير', line: 'سطوع يكفي لشمس الظهيرة.' } },
  { slug: 'eid-gift-sets', service: 'gifts-apparel', year: 2024, sample: true, look: 'object', photos: [gift('dallah-set'), gift('tumbler-duo')],
    en: { title: 'Eid gift sets for clients', client: 'A law firm', place: 'Madinat Sultan Qaboos', line: 'Dallah sets and tumblers, boxed and branded.' },
    ar: { title: 'هدايا العيد للعملاء', client: 'مكتب محاماة', place: 'مدينة السلطان قابوس', line: 'دلال وأكواب في علب تحمل الشعار.' } },
  { slug: 'expo-stand', service: 'exhibitions-events', year: 2025, sample: true, look: 'drawing', photos: [plate('exhibitions-events')],
    en: { title: 'A stand at the exhibition centre', client: 'A building-materials brand', place: 'OCEC', line: 'Built, lit and branded in four days.' },
    ar: { title: 'جناح في مركز المعارض', client: 'علامة مواد بناء', place: 'مركز عُمان للمؤتمرات والمعارض', line: 'بناء وإضاءة وهوية في أربعة أيام.' } },
  { slug: 'conference-kit', service: 'gifts-apparel', year: 2024, sample: true, look: 'object',
    photos: [gift('backpack'), sub('gifts-apparel', 'tote-bag'), sub('gifts-apparel', 'notebook-cork')],
    en: { title: 'Delegate kits for a conference', client: 'An energy conference', place: 'Muscat', line: 'Backpacks, totes and notebooks for six hundred delegates.' },
    ar: { title: 'حقائب المشاركين في مؤتمر', client: 'مؤتمر للطاقة', place: 'مسقط', line: 'حقائب ظهر وحقائب قماشية ودفاتر لستمئة مشارك.' } },
  { slug: 'national-day', service: 'flags-banners', year: 2025, sample: true, look: 'drawing', photos: [plate('flags-banners')],
    en: { title: 'Flags for National Day', client: 'A municipality', place: 'Muscat', line: 'Two hundred pole banners along the corniche.' },
    ar: { title: 'أعلام للعيد الوطني', client: 'بلدية', place: 'مسقط', line: 'مئتا لافتة أعمدة على الكورنيش.' } },
  { slug: 'sports-trophies', service: 'acrylic-awards', year: 2025, sample: true, look: 'object', photos: ['/subcategories/acrylic-awards/trophy-crop.webp'],
    en: { title: 'Trophies for a sports day', client: 'A school', place: 'Seeb', line: 'Wood and marble, engraved for every winner.' },
    ar: { title: 'كؤوس ليوم رياضي', client: 'مدرسة', place: 'السيب', line: 'خشب ورخام، محفورة باسم كل فائز.' } },
  { slug: 'company-stationery', service: 'print-stationery', year: 2024, sample: true, look: 'drawing', photos: [plate('print-stationery')],
    en: { title: 'A stationery set for a new brand', client: 'A new clinic', place: 'Qurum', line: 'Cards, letterheads, folders and envelopes.' },
    ar: { title: 'مطبوعات مكتبية لهوية جديدة', client: 'عيادة جديدة', place: 'القرم', line: 'بطاقات وأوراق رسمية وملفات وأظرف.' } },
  { slug: 'service-plaques', service: 'acrylic-awards', year: 2024, sample: true, look: 'object', photos: ['/subcategories/acrylic-awards/plaques-crop.webp'],
    en: { title: 'Long-service plaques', client: 'A bank', place: 'Ruwi', line: 'Acrylic and wood, one for every ten years.' },
    ar: { title: 'دروع لسنوات الخدمة', client: 'بنك', place: 'روي', line: 'أكريليك وخشب، درع لكل عشر سنوات.' } },
];
