export type TeamMember = {
  id: string
  name: string
  role: string
  group: TeamGroupId
  bio?: string
  skills?: string[]
  image?: { src: string; alt: string }
  links?: Array<{ label: string; href: string }>
  placeholder?: boolean
}

export type TeamGroupId =
  | 'leadership'
  | 'engineering'
  | 'design'
  | 'marketing'
  | 'operations'

export const teamGroups: Array<{ id: TeamGroupId; label: string }> = [
  { id: 'leadership', label: 'Leadership' },
  { id: 'engineering', label: 'Developers' },
  { id: 'design', label: 'Design' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'operations', label: 'Operations' },
]

/** Add verified members only. Empty until profiles are confirmed. */
export const teamMembers: TeamMember[] = []

export const teamArchitectureNote =
  'Team profiles are added as roles are filled. Each entry is verified before publication—no placeholder people are shown as real staff.'
