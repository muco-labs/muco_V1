export const site = {
  name: 'MUCO LABS',
  legalName: 'MUCO LABS',
  tagline:
    'Technology company building products, platforms and growth systems.',
  positioning:
    'MUCO LABS designs, builds, automates and grows digital businesses through technology, software, AI and digital solutions.',
  defaultTitle: 'MUCO LABS | Technology, Software, AI & Digital Solutions',
  defaultDescription:
    'MUCO LABS designs, builds and automates digital products with software, AI and growth systems for businesses that need a serious technology partner.',
  locale: 'en',
  contactEmail: 'hello@mucolabs.com',
  social: {
    linkedin: '',
    github: '',
    x: '',
  },
} as const

export type SiteConfig = typeof site
