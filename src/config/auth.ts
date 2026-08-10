import { env } from '@/config/env'
import { portalOrigins } from '@/config/hosts'

export const authRoutes = {
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  callback: '/auth/callback',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  verifyEmail: '/auth/verify-email',
  teamSignIn: '/team/sign-in',
  adminSignIn: '/admin/sign-in',
} as const

export const portalRoutes = {
  customer: '/app',
  employee: '/team',
  freelancer: '/app/freelancer',
  admin: '/admin',
  unauthorized: '/auth/unauthorized',
} as const

export const authCopy = {
  brandLabel: 'MUCO LABS',
  signInTitle: 'Welcome back',
  signUpTitle: 'Create your account',
  teamSignInTitle: 'Team sign in',
  adminSignInTitle: 'Admin sign in',
  forgotTitle: 'Reset your password',
  resetTitle: 'Choose a new password',
  verifyTitle: 'Verify your email',
  unauthorizedTitle: 'Access denied',
  supabaseMissing:
    'Authentication is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
  appOrigin: env.appUrl,
  teamOrigin: portalOrigins.employee,
  adminOrigin: portalOrigins.admin,
} as const
