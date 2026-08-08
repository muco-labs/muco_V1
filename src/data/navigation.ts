import { routePaths } from '@/config/routes'
import { authRoutes } from '@/config/auth'

export type NavItem = {
  label: string
  href: string
}

export const primaryNav: NavItem[] = [
  { label: 'Services', href: routePaths.services },
  { label: 'Solutions', href: routePaths.solutions },
  { label: 'Work', href: routePaths.work },
  { label: 'About', href: routePaths.about },
  { label: 'Pricing', href: routePaths.pricing },
  { label: 'Contact', href: routePaths.contact },
]

export const footerNav = {
  explore: [
    { label: 'Services', href: routePaths.services },
    { label: 'Solutions', href: routePaths.solutions },
    { label: 'Work', href: routePaths.work },
    { label: 'About', href: routePaths.about },
    { label: 'Insights', href: routePaths.insights },
    { label: 'Contact', href: routePaths.contact },
    { label: 'Pricing', href: routePaths.pricing },
  ],
  customer: [
    { label: 'Sign in', href: authRoutes.signIn },
    { label: 'Sign up', href: authRoutes.signUp },
  ],
  legal: [
    { label: 'Privacy Policy', href: routePaths.privacy },
    { label: 'Terms', href: routePaths.terms },
    { label: 'Cookie Policy', href: routePaths.cookies },
  ],
} as const
