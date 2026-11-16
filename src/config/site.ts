// Contact details confirmed from the client's company profile PDF (Nov 2026). Socials are still
// blank on purpose: Footer skips whatever is empty, so filling one in is enough to make it appear.
export const site = {
  name: 'Creative Screens',
  url: 'https://creativescreens.co', // confirmed — matches the company profile
  whatsapp: '96895781215', // the profile only lists this as a phone line; confirm it's WhatsApp-enabled before relying on it
  phoneDisplay: '+968 9578 1215 / 9578 1216',
  email: 'sales@creativescreens.co',
  address: 'Al Wadi Al Kabir, Muscat, Sultanate of Oman',
  socials: {
    instagram: '', // full URL, e.g. 'https://instagram.com/creativescreens'
    facebook: '',
    linkedin: '',
    tiktok: '',
  },
};

// Staging is noindex until NEXT_PUBLIC_STAGING=false is set at launch.
export const isStaging = process.env.NEXT_PUBLIC_STAGING !== 'false';
