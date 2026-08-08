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
  company: [
    { label: 'About', href: routePaths.about },
    { label: 'Work', href: routePaths.work },
    { label: 'Insights', href: routePaths.insights },
    { label: 'Contact', href: routePaths.contact },
  ],
  services: [
    { label: 'All services', href: routePaths.services },
    { label: 'Solutions', href: routePaths.solutions },
  ],
  legal: [
    { label: 'Privacy policy', href: routePaths.privacy },
    { label: 'Terms', href: routePaths.terms },
    { label: 'Cookie policy', href: routePaths.cookies },
  ],
} as const
