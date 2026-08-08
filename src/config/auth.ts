import { env } from '@/config/env'

export const authRoutes = {
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
} as const

/** Future protected app areas (app.mucolabs.com) */
export const futureAppRoutes = {
  customer: '/app/customer',
  employee: '/app/employee',
  admin: '/app/admin',
} as const

export const authCopy = {
  signInTitle: 'Customer sign in',
  signUpTitle: 'Create your account',
  placeholder:
    'Authentication is not live on the marketing site yet. This route reserves UX and URLs for the upcoming customer portal.',
  appOrigin: env.appUrl,
} as const

/**
 * Auth security (future): httpOnly session cookies or short-lived tokens issued by the API;
 * password hashing and MFA on server; no long-lived secrets in localStorage.
 */
