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

/** Only verified individuals — additional profiles publish when confirmed. */
export const teamMembers: TeamMember[] = [
  {
    id: 'srinivash-mahalingam',
    name: 'Srinivash Mahalingam',
    role: 'Founder & Managing Director',
    group: 'leadership',
    bio: 'Leads MUCO LABS strategy, engineering standards and founder-led client delivery.',
    skills: ['Product direction', 'Software architecture', 'Client delivery'],
  },
]

export const teamHiringNote =
  'We collaborate with specialists across engineering, design and marketing. Public profiles are added only when verified—no placeholder staff listings.'
