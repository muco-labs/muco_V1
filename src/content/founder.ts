import { contact } from '@/content/contact'
import { socialLinks } from '@/content/social'

export type FounderProfileStatus = 'pending_verification' | 'published'

export type FounderProfile = {
  status: FounderProfileStatus
  name: string
  title: string
  introduction: string
  vision: string
  philosophy: string
  role: string
  skills: string[]
  interests: string[]
  /** Optional path under /public — add verified portrait when available. */
  imageSrc?: string
  links: Array<{ label: string; href: string }>
}

export const founder: FounderProfile = {
  status: 'published',
  name: 'Srinivash Mahalingam',
  title: 'Founder & Managing Director',
  introduction:
    'Srinivash Mahalingam leads MUCO LABS with hands-on responsibility for product direction, client delivery and technical standards. Clients work directly with leadership—from discovery through launch.',
  vision:
    'A technology company from Erode that competes on craft and clarity—where small teams ship serious software and growing businesses get a partner who stays accountable after launch.',
  philosophy:
    'Technology should reduce operational chaos. We favour small, accountable teams, maintainable codebases and designs that stay legible as products grow.',
  role: 'Sets direction, owns delivery standards and remains the escalation path for client engagements.',
  skills: [
    'Product & technical direction',
    'Full-stack software delivery',
    'Client discovery and scoping',
    'Applied AI and automation strategy',
  ],
  interests: [
    'Product engineering',
    'Applied AI & automation',
    'Founder-led client partnerships',
    'Building from Erode for global markets',
  ],
  links: [
    { label: 'Email', href: `mailto:${contact.email}` },
    { label: 'LinkedIn (company)', href: socialLinks.linkedin },
    { label: 'X', href: socialLinks.x },
  ],
}
