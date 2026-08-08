import { routePaths } from '@/config/routes'

export type NavItem = {
  label: string
  href: string
}

export const primaryNav: NavItem[] = [
  { label: 'Services', href: routePaths.services },
  { label: 'Solutions', href: routePaths.solutions },
  { label: 'Work', href: routePaths.work },
  { label: 'About', href: routePaths.about },
  { label: 'Insights', href: routePaths.insights },
]

export const footerNav = {
  explore: [
    { label: 'Services', href: routePaths.services },
    { label: 'Solutions', href: routePaths.solutions },
    { label: 'Work', href: routePaths.work },
    { label: 'About', href: routePaths.about },
    { label: 'Insights', href: routePaths.insights },
    { label: 'Contact', href: routePaths.contact },
  ],
  legal: [
    { label: 'Privacy Policy', href: routePaths.privacy },
    { label: 'Terms', href: routePaths.terms },
    { label: 'Cookie Policy', href: routePaths.cookies },
  ],
} as const
