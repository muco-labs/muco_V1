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
  formGuidance: {
    headline: 'What to include',
    bullets: [
      'What you are building (website, app, software, AI, marketing, etc.)',
      'Who it is for and the problem you are solving',
      'Timeline or launch target, if you have one',
      'Budget range or constraints, if known',
      'Links to references, existing product or competitors (optional)',
    ],
    afterSubmit:
      'We review your message and reply with a practical next step—usually a short call or a scoped follow-up—not a generic brochure.',
  },
} as const
