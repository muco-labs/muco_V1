import { brandAssets } from '@/config/brand-assets'
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
  quote: string
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
    'Visionary software architect and founder of MUCO Labs. Leads full-stack web, mobile app development, Gemini AI integration, and company expansion across global markets—with hands-on responsibility for product direction, client delivery and technical standards.',
  vision:
    'Build MUCO Labs into one of India’s leading technology companies from Erode—shipping websites, Android applications, AI solutions, SaaS platforms and business systems with craft and clarity.',
  philosophy:
    'Technology is my tool. Innovation is my language. People are my purpose. MUCO Labs is my legacy. We favour small, accountable teams, maintainable codebases and designs that stay legible as products grow.',
  quote:
    'Technology is my tool. Innovation is my language. People are my purpose. MUCO Labs is my legacy.',
  role: 'Sets direction, owns delivery standards and remains the escalation path for client engagements—from discovery through launch.',
  skills: [
    'System architecture',
    'Full-stack web & mobile',
    'Gemini AI & automation',
    'React, Node.js & cloud DevOps',
    'Product & client partnership',
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
  imageSrc:
    brandAssets.founderPhoto.status === 'available' ? brandAssets.founderPhoto.src : undefined,
}
