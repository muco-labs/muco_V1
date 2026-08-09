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

export const freelancerNav = [
  { label: 'Dashboard', path: freelancerPortalPaths.root, end: true },
  { label: 'My projects', path: freelancerPortalPaths.projects },
  { label: 'Tasks', path: freelancerPortalPaths.tasks },
  { label: 'My services', path: freelancerPortalPaths.services },
  { label: 'My skills', path: freelancerPortalPaths.skills },
  { label: 'Profile', path: freelancerPortalPaths.profile },
  { label: 'Availability', path: freelancerPortalPaths.availability },
] as const
