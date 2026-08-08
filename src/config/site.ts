export const site = {
  name: 'MUCO LABS',
  legalName: 'MUCO LABS',
  tagline:
    'Technology, software, AI, and digital solutions for businesses that intend to grow.',
  positioning:
    'MUCO LABS designs, builds, automates and grows digital businesses through technology, software, AI and digital solutions.',
  defaultTitle: 'MUCO LABS — Technology & Digital Solutions',
  defaultDescription:
    'MUCO LABS designs, builds, automates and grows digital businesses through technology, software, AI and digital solutions.',
  locale: 'en',
  contactEmail: 'hello@mucolabs.com',
  social: {
    linkedin: '',
    github: '',
    x: '',
  },
} as const

export type SiteConfig = typeof site
