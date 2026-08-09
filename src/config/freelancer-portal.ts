export const freelancerPortalPaths = {
  root: '/app/freelancer',
  projects: '/app/freelancer/projects',
  projectDetail: (id: string) => `/app/freelancer/projects/${id}`,
  tasks: '/app/freelancer/tasks',
  profile: '/app/freelancer/profile',
  availability: '/app/freelancer/availability',
} as const

export const freelancerNav = [
  { label: 'Dashboard', path: freelancerPortalPaths.root, end: true },
  { label: 'My projects', path: freelancerPortalPaths.projects },
  { label: 'Tasks', path: freelancerPortalPaths.tasks },
  { label: 'Profile', path: freelancerPortalPaths.profile },
  { label: 'Availability', path: freelancerPortalPaths.availability },
] as const
