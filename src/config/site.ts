export const site = {
  name: 'MUCO LABS',
  legalName: 'MUCO LABS Technology & Digital Innovations',
  tagline:
    'Technology company building products, platforms and growth systems.',
  positioning:
    'MUCO LABS designs, builds, automates and grows digital businesses through technology, software, AI and digital solutions.',
  defaultTitle: 'MUCO LABS | Technology, Software, AI & Digital Solutions',
  defaultDescription:
    'Founder-led software studio in Erode, Tamil Nadu—websites, apps, custom software, AI and digital marketing with clear public pricing.',
  locale: 'en-IN',
  contactEmail: 'contact@mucolabs.com',
  contactPhone: '+916381809844',
  contactPhoneDisplay: '+91 63818 09844',
  social: {
    linkedin: 'https://www.linkedin.com/company/muco-labs',
    instagram: 'https://www.instagram.com/muco_labs/',
    x: 'https://x.com/muco_labs',
    github: '',
  },
} as const

export type SiteConfig = typeof site
