// PLACEHOLDER contact details. Replace from the client's content checklist before staging is shared.
// address and socials are blank on purpose: Footer/Header skip whatever is empty, so filling one in is
// enough to make it appear — no other file needs editing.
export const site = {
  name: 'Creative Screens',
  url: 'https://creativescreens.co', // confirm this is the domain the client owns
  whatsapp: '96800000000',
  phoneDisplay: '+968 XXXX XXXX',
  email: 'hello@creativescreens.co',
  address: '', // e.g. 'Way 123, Al Khuwair, Muscat, Oman' — leave blank to hide
  socials: {
    instagram: '', // full URL, e.g. 'https://instagram.com/creativescreens'
    facebook: '',
    linkedin: '',
    tiktok: '',
  },
};

// Staging is noindex until NEXT_PUBLIC_STAGING=false is set at launch.
export const isStaging = process.env.NEXT_PUBLIC_STAGING !== 'false';
