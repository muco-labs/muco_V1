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

export function presentProjectMemberRoleLabel(role: string): string {
  const trimmed = role.trim().toLowerCase().replace(/\s+/g, '_')
  const key = (trimmed === 'member' ? 'other' : trimmed) as ProjectMemberRole
  if ((PROJECT_MEMBER_ROLES as readonly string[]).includes(key)) {
    return ROLE_LABELS[key]
  }
  return role.replace(/_/g, ' ')
}
