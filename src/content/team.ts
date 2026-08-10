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
    bio: 'Expert full-stack senior developer and 2D/3D AutoCAD design lead. Oversees complex web architectures, database schemas, industrial CAD drawings, and elevation modeling.',
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
    bio: 'Drives performance digital marketing campaigns, SEO indexing, brand growth, social media strategy, and day-to-day company operations at MUCO Labs.',
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
    bio: 'Manages enterprise client communications, telecalling operations, billing, invoicing, transparent upfront pricing quotes, and financial accounts at MUCO Labs.',
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
    bio: 'Leads talent acquisition, human resource development, internal engineering culture, campus outreach, and field marketing initiatives for MUCO Labs.',
    skills: [
      'Human Resources',
      'Talent Acquisition',
      'Field Marketing',
      'Team Culture',
      'Campus Outreach',
    ],
    imageSrc: '/brand/Venkatesh.jpeg',
    imageObjectPosition: 'center 12%',
    links: [
      { label: '+91 97896 25012', href: 'tel:+919789625012' },
      { label: 'hr@mucolabs.com', href: 'mailto:hr@mucolabs.com' },
    ],
  },
]

export const teamHiringNote =
  'Verified specialists across engineering, marketing, finance, and HR—based in Erode, Tamil Nadu.'
