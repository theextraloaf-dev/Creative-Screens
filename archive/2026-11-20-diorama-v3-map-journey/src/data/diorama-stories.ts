/* The five stop stories and the map pins of the diorama journey (EN/AR).
   Every entry is a PLACEHOLDER until the client sends real jobs: `placeholder: true` shows a "Sample" tag on the
   postcard and the story sheet, and the preview stays noindex. Replace photos in public/diorama/stories/ with the
   same names, set `placeholder: false`, and edit the copy here. Arabic copy is a first draft for client review. */

export type Locale = 'en' | 'ar';
export type StorySlug = 'signage' | 'wrap' | 'led' | 'stand' | 'flags';
export interface StoryCopy { title: string; client: string; place: string; line: string; body: string }
export interface Story { n: number; slug: StorySlug; service: string; placeholder: boolean; photos: string[]; en: StoryCopy; ar: StoryCopy }

const photos = (slug: StorySlug) => [1, 2, 3, 4].map((i) => `/diorama/stories/${slug}-${i}.webp`);

export const stories: Story[] = [
  {
    n: 1, slug: 'signage', service: 'signage', placeholder: true, photos: photos('signage'),
    en: {
      title: 'A shopfront you can read from the corniche', client: 'A café in Mutrah', place: 'Muscat',
      line: 'Fascia sign, awning graphics and window lettering, made and fitted in a week.',
      body: 'The café wanted to be found from across the road at dusk. We cut the fascia from composite panel, printed the artwork on outdoor vinyl with a UV laminate, and fitted it overnight so the café never closed.',
    },
    ar: {
      title: 'واجهة متجر تُقرأ من الكورنيش', client: 'مقهى في مطرح', place: 'مسقط',
      line: 'لوحة الواجهة ورسومات المظلة وكتابة النوافذ، صُنعت ورُكّبت خلال أسبوع.',
      body: 'أراد المقهى أن يُرى من الجهة الأخرى للشارع عند الغروب. قصصنا لوحة الواجهة من ألواح الكومبوزيت، وطبعنا التصميم على فينيل خارجي مع طبقة حماية من الأشعة، وركّبناها ليلاً حتى لا يُغلق المقهى.',
    },
  },
  {
    n: 2, slug: 'wrap', service: 'graphics', placeholder: true, photos: photos('wrap'),
    en: {
      title: 'A school bus that carries the brand', client: 'A transport company', place: 'Sohar',
      line: 'Full-side vehicle wrap, designed to survive the summer sun.',
      body: 'We measured the bus, set the artwork around windows and wheel arches, printed on cast vinyl and laminated it for heat. Fitted in our workshop in two days.',
    },
    ar: {
      title: 'حافلة تحمل العلامة التجارية', client: 'شركة نقل', place: 'صحار',
      line: 'تغليف كامل لجانب المركبة، مصمّم ليتحمّل شمس الصيف.',
      body: 'قسنا الحافلة، ووزّعنا التصميم حول النوافذ وأقواس العجلات، وطبعنا على فينيل مصبوب مع طبقة حماية من الحرارة. رُكّب في ورشتنا خلال يومين.',
    },
  },
  {
    n: 3, slug: 'led', service: 'led-screens', placeholder: true, photos: photos('led'),
    en: {
      title: 'A screen that turns a wall into a billboard', client: 'A retail tower', place: 'Al Khuwair',
      line: 'Outdoor LED wall, supplied, installed and loaded with a launch loop.',
      body: 'A blank façade became the street’s brightest corner. We supplied the outdoor LED cabinets, built the steel frame, wired the controller and delivered the first content loop for opening night.',
    },
    ar: {
      title: 'شاشة تحوّل الجدار إلى لوحة إعلانية', client: 'برج تجاري', place: 'الخوير',
      line: 'جدار LED خارجي، توريداً وتركيباً مع محتوى افتتاحي.',
      body: 'تحوّلت واجهة فارغة إلى أكثر زوايا الشارع إشراقاً. ورّدنا وحدات LED الخارجية، وبنينا الإطار الفولاذي، ووصلنا وحدة التحكم، وسلّمنا أول محتوى لليلة الافتتاح.',
    },
  },
  {
    n: 4, slug: 'stand', service: 'exhibitions-events', placeholder: true, photos: photos('stand'),
    en: {
      title: 'An exhibition stand built in a weekend', client: 'A tech brand', place: 'Oman Convention & Exhibition Centre',
      line: 'Back wall, header, counter and stools, printed and built on site.',
      body: 'Six by four metres, designed around one product launch. Fabric back wall, a lit header and a branded counter, built on the Friday and ready for the doors on Saturday.',
    },
    ar: {
      title: 'جناح معرض بُني في عطلة نهاية الأسبوع', client: 'علامة تقنية', place: 'مركز عُمان للمؤتمرات والمعارض',
      line: 'جدار خلفي وواجهة علوية وطاولة استقبال، طُبعت وبُنيت في الموقع.',
      body: 'ستة أمتار في أربعة، صُمّم حول إطلاق منتج واحد. جدار خلفي من القماش وواجهة علوية مضاءة وطاولة تحمل الهوية، بُني يوم الجمعة وجاهز لاستقبال الزوار يوم السبت.',
    },
  },
  {
    n: 5, slug: 'flags', service: 'flags-banners', placeholder: true, photos: photos('flags'),
    en: {
      title: 'Flags that lead the way to the race', client: 'A sports event', place: 'Muscat corniche',
      line: 'Feather flags and a sea-wall banner along the route.',
      body: 'Forty feather flags and a sixty-metre banner, printed on knitted polyester so the colour stays bright in the wind. Set out at dawn, collected by noon.',
    },
    ar: {
      title: 'أعلام تقود الطريق إلى السباق', client: 'فعالية رياضية', place: 'كورنيش مسقط',
      line: 'أعلام ريشة ولافتة على جدار البحر على طول المسار.',
      body: 'أربعون علم ريشة ولافتة بطول ستين متراً، مطبوعة على قماش بوليستر محبوك حتى يبقى اللون زاهياً في الريح. نُصبت عند الفجر وجُمعت قبل الظهر.',
    },
  },
];

export interface PinCopy { title: string; place: string }
export const pinCopy: Record<string, { placeholder: boolean; photo: string; story: StorySlug; en: PinCopy; ar: PinCopy }> = {
  muscat: { placeholder: true, photo: '/diorama/stories/signage-2.webp', story: 'signage', en: { title: 'Shopfront signs', place: 'Muscat' }, ar: { title: 'لوحات واجهات المتاجر', place: 'مسقط' } },
  sohar: { placeholder: true, photo: '/diorama/stories/wrap-2.webp', story: 'wrap', en: { title: 'Fleet wraps', place: 'Sohar' }, ar: { title: 'تغليف الأساطيل', place: 'صحار' } },
  nizwa: { placeholder: true, photo: '/diorama/stories/stand-2.webp', story: 'stand', en: { title: 'An event stand', place: 'Nizwa' }, ar: { title: 'جناح فعالية', place: 'نزوى' } },
  sur: { placeholder: true, photo: '/diorama/stories/flags-2.webp', story: 'flags', en: { title: 'Festival flags', place: 'Sur' }, ar: { title: 'أعلام مهرجان', place: 'صور' } },
  salalah: { placeholder: true, photo: '/diorama/stories/led-2.webp', story: 'led', en: { title: 'An LED wall', place: 'Salalah' }, ar: { title: 'جدار LED', place: 'صلالة' } },
  duqm: { placeholder: true, photo: '/diorama/stories/wrap-3.webp', story: 'wrap', en: { title: 'Site vehicle graphics', place: 'Duqm' }, ar: { title: 'رسومات مركبات المواقع', place: 'الدقم' } },
};

export const storyBySlug = (slug: string) => stories.find((s) => s.slug === slug);
export const storySlugs = (): StorySlug[] => [...stories].sort((a, b) => a.n - b.n).map((s) => s.slug);
export const storyUrl = (n: number, locale: Locale) => `${locale === 'ar' ? '/ar' : ''}/preview/${stories.find((s) => s.n === n)!.slug}/`;

export function hotspotLabel(n: number, locale: Locale): string {
  const st = stories.find((s) => s.n === n)!;
  return locale === 'ar' ? `المحطة ${n}: ${st.ar.title} — اعرض العمل` : `Stop ${n}: ${st.en.title} — see the job`;
}

export function pinLabel(slug: string, locale: Locale): string {
  const p = pinCopy[slug];
  return locale === 'ar' ? `${p.ar.title}، ${p.ar.place}` : `${p.en.title}, ${p.en.place}`;
}
