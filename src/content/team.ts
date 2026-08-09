export type TeamGroupId =
  | 'leadership'
  | 'engineering'
  | 'design'
  | 'marketing'
  | 'operations'

export type TeamMember = {
  id: string
  name: string
  role: string
  group: TeamGroupId
  bio?: string
  skills?: string[]
  imageSrc?: string
  /** CSS object-position for portrait crops */
  imageObjectPosition?: string
  links?: Array<{ label: string; href: string }>
}

export const teamGroups: Array<{ id: TeamGroupId; label: string; description: string }> = [
  {
    id: 'leadership',
    label: 'Leadership',
    description: 'Direction, delivery standards and client partnership.',
  },
  {
    id: 'engineering',
    label: 'Engineering',
    description: 'Web, mobile, cloud and custom software delivery.',
  },
  {
    id: 'design',
    label: 'Design',
    description: 'Product UX, brand systems and interface craft.',
  },
  {
    id: 'marketing',
    label: 'Growth',
    description: 'SEO, performance marketing and analytics.',
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Project coordination, support and maintenance.',
  },
]

/** Verified team — founder profile lives in `src/content/founder.ts`. */
export const teamMembers: TeamMember[] = [
  {
    id: 'vinoth',
    name: 'Vinoth',
    role: 'Senior Developer & AutoCAD Designer',
    group: 'engineering',
    bio: 'MUCO Labs Technical Lead — full-stack core development, 2D/3D AutoCAD blueprinting, database architecture, and code quality & security.',
    skills: [
      'Full-Stack Core',
      'AutoCAD 2D/3D',
      'TypeScript',
      'Database Architecture',
      'System Security',
    ],
    imageSrc: '/brand/Vinoth.png',
    imageObjectPosition: 'center 12%',
    links: [{ label: 'developer@mucolabs.com', href: 'mailto:developer@mucolabs.com' }],
  },
  {
    id: 'chandru',
    name: 'Chandru',
    role: 'Digital Marketing Head & Company Handler',
    group: 'marketing',
    bio: 'MUCO Labs Marketing Operations — SEO and organic growth, performance ads, brand & media strategy, and company operations.',
    skills: [
      'SEO & Indexing',
      'Performance Ads',
      'Brand & Media Strategy',
      'Operations Handling',
      'Social Marketing',
    ],
    imageSrc: '/brand/chandru.png',
    imageObjectPosition: 'center 15%',
    links: [
      { label: '+91 90426 40365', href: 'tel:+919042640365' },
      { label: 'marketing@mucolabs.com', href: 'mailto:marketing@mucolabs.com' },
    ],
  },
  {
    id: 'marimuthu',
    name: 'Marimuthu',
    role: 'Telecalling Head & Accounts Head',
    group: 'operations',
    bio: 'MUCO Labs Financial & Client Support — telecalling, corporate accounting, invoice audits, billing and retainers.',
    skills: [
      'Corporate Accounting',
      'Client Support',
      'Invoicing & Audits',
      'Upfront Pricing',
      'Billing Systems',
    ],
    imageSrc: '/brand/marimuthu.png',
    imageObjectPosition: 'center 18%',
    links: [
      { label: '+91 96269 11874', href: 'tel:+919626911874' },
      { label: 'contact@mucolabs.com', href: 'mailto:contact@mucolabs.com' },
      { label: 'support@mucolabs.com', href: 'mailto:support@mucolabs.com' },
    ],
  },
  {
    id: 'venkatesh',
    name: 'Venkatesh',
    role: 'Marketing & Human Resource Manager',
    group: 'marketing',
    bio: 'MUCO Labs HR & Field Marketing — recruitment, field outreach, team culture, and talent onboarding.',
    skills: [
      'Human Resources',
      'Talent Acquisition',
      'Field Marketing',
      'Team Culture',
      'Campus Outreach',
    ],
    imageSrc: '/brand/Venkatesh.jpeg',
    imageObjectPosition: 'center 10%',
    links: [
      { label: '+91 97896 25012', href: 'tel:+919789625012' },
      { label: 'hr@mucolabs.com', href: 'mailto:hr@mucolabs.com' },
    ],
  },
]

export const teamHiringNote =
  'Verified specialists across engineering, marketing, finance, and HR—based in Erode, Tamil Nadu.'
