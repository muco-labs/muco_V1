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
    bio: 'Full-stack technical lead for web architectures, databases, and 2D/3D AutoCAD delivery.',
    skills: ['Full-Stack', 'AutoCAD 2D/3D', 'TypeScript', 'Databases'],
    imageSrc: '/brand/Vinoth.png',
    imageObjectPosition: 'center 12%',
    links: [{ label: 'developer@mucolabs.com', href: 'mailto:developer@mucolabs.com' }],
  },
  {
    id: 'chandru',
    name: 'Chandru',
    role: 'Digital Marketing Head',
    group: 'marketing',
    bio: 'Owns SEO, performance ads, brand growth, and day-to-day marketing operations.',
    skills: ['SEO', 'Performance Ads', 'Brand Strategy', 'Social'],
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
    role: 'Telecalling & Accounts Head',
    group: 'operations',
    bio: 'Handles client communications, billing, invoicing, and transparent package quotes.',
    skills: ['Accounts', 'Client Support', 'Invoicing', 'Pricing'],
    imageSrc: '/brand/marimuthu.png',
    imageObjectPosition: 'center 18%',
    links: [
      { label: '+91 96269 11874', href: 'tel:+919626911874' },
      { label: 'contact@mucolabs.com', href: 'mailto:contact@mucolabs.com' },
    ],
  },
  {
    id: 'venkatesh',
    name: 'Venkatesh',
    role: 'Marketing & HR Manager',
    group: 'marketing',
    bio: 'Leads talent acquisition, team culture, campus outreach, and field marketing.',
    skills: ['HR', 'Recruitment', 'Field Marketing', 'Culture'],
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
