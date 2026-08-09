export const PROJECT_MEMBER_ROLES = [
  'project_manager',
  'developer',
  'designer',
  'seo',
  'marketing',
  'content',
  'qa',
  'other',
] as const

export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number]

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  project_manager: 'Project manager',
  developer: 'Developer',
  designer: 'Designer',
  seo: 'SEO',
  marketing: 'Marketing',
  content: 'Content',
  qa: 'QA',
  other: 'Other',
}

export function normalizeProjectMemberRole(input: string): ProjectMemberRole | null {
  const trimmed = input.trim().toLowerCase().replace(/\s+/g, '_')
  if (trimmed === 'member') return 'other'
  if ((PROJECT_MEMBER_ROLES as readonly string[]).includes(trimmed)) {
    return trimmed as ProjectMemberRole
  }
  return null
}

export function presentProjectMemberRoleLabel(role: string): string {
  const normalized = normalizeProjectMemberRole(role)
  if (normalized) return ROLE_LABELS[normalized]
  return role.replace(/_/g, ' ')
}
