export const freelancerPortalPaths = {
  root: '/app/freelancer',
  profile: '/app/freelancer/profile',
  availability: '/app/freelancer/availability',
} as const

export const freelancerNav = [
  { label: 'Dashboard', path: freelancerPortalPaths.root, end: true },
  { label: 'Profile', path: freelancerPortalPaths.profile },
  { label: 'Availability', path: freelancerPortalPaths.availability },
] as const
