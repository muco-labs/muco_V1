import { routePaths, servicePath } from '@/config/routes'
import { authRoutes } from '@/config/auth'

export type NavChild = {
  label: string
  href: string
  description?: string
}

export type NavItem =
  | { label: string; href: string; children?: undefined }
  | { label: string; href?: string; children: NavChild[] }

export const primaryNav: NavItem[] = [
  {
    label: 'Services',
    children: [
      { label: 'All services', href: routePaths.services, description: 'Full catalog' },
      { label: 'Website development', href: servicePath('web-development') },
      { label: 'Custom software & SaaS', href: servicePath('software-development') },
      { label: 'Mobile apps', href: servicePath('mobile-app-development') },
      { label: 'E-commerce', href: servicePath('ecommerce-development') },
      { label: 'AI & automation', href: servicePath('ai-solutions') },
      { label: 'Business automation', href: servicePath('automation') },
      { label: 'UI/UX design', href: servicePath('ui-ux-design') },
      { label: 'Digital marketing', href: servicePath('digital-marketing') },
      { label: 'SEO', href: servicePath('seo') },
      { label: 'Technology consulting', href: servicePath('technology-consulting') },
    ],
  },
  {
    label: 'Publish apps',
    children: [
      { label: 'Products', href: '/products', description: 'SaaS & platforms' },
      { label: 'Client Hub', href: '/products/client-hub' },
    ],
  },
  { label: 'Work', href: routePaths.work },
  { label: 'About', href: routePaths.about },
  { label: 'Pricing', href: routePaths.pricing },
]

export const footerNav = {
  explore: [
    { label: 'Services', href: routePaths.services },
    { label: 'Products', href: '/products' },
    { label: 'Solutions', href: routePaths.solutions },
    { label: 'Work', href: routePaths.work },
    { label: 'About', href: routePaths.about },
    { label: 'Erode', href: routePaths.erode },
    { label: 'Tamil Nadu', href: routePaths.tamilNadu },
    { label: 'India', href: routePaths.india },
    { label: 'International', href: routePaths.international },
    { label: 'Insights', href: routePaths.insights },
    { label: 'Contact', href: routePaths.contact },
    { label: 'Careers', href: routePaths.careers },
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
