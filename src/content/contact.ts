/** Verified contact details (public site + humans.txt + schema on mucolabs.com). */
export const contact = {
  email: 'contact@mucolabs.com',
  phoneDisplay: '+91 63818 09844',
  phoneTel: '+916381809844',
  whatsappNote:
    'WhatsApp enquiries are handled through the official MUCO LABS channel when enabled on the live site.',
  responseExpectation:
    'We aim to respond to new project enquiries within one business day (Mon–Sat).',
  hours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '19:00',
    timezone: 'Asia/Kolkata',
  },
  languages: ['English', 'Tamil'],
} as const
