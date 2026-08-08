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
