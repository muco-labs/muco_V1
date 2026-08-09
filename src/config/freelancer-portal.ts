export const freelancerPortalPaths = {
  root: '/app/freelancer',
  projects: '/app/freelancer/projects',
  projectDetail: (id: string) => `/app/freelancer/projects/${id}`,
  tasks: '/app/freelancer/tasks',
  services: '/app/freelancer/services',
  skills: '/app/freelancer/skills',
  profile: '/app/freelancer/profile',
  availability: '/app/freelancer/availability',
} as const

export const freelancerNavPrimary = [
  { label: 'Dashboard', path: freelancerPortalPaths.root, end: true },
  { label: 'Tasks', path: freelancerPortalPaths.tasks },
  { label: 'My projects', path: freelancerPortalPaths.projects },
  { label: 'My services', path: freelancerPortalPaths.services },
  { label: 'My skills', path: freelancerPortalPaths.skills },
  { label: 'Availability', path: freelancerPortalPaths.availability },
] as const

export const freelancerNavMore = [{ label: 'Profile', path: freelancerPortalPaths.profile }] as const

/** @deprecated Use freelancerNavPrimary + freelancerNavMore */
export const freelancerNav = [...freelancerNavPrimary, ...freelancerNavMore] as const
