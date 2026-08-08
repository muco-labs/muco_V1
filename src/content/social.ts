/** Verified public profiles — do not add unverified URLs. */
export const socialLinks = {
  instagram: 'https://www.instagram.com/muco_labs/',
  linkedin: 'https://www.linkedin.com/company/muco-labs',
  x: 'https://x.com/muco_labs',
} as const

export const socialLinkList = [
  { id: 'instagram', label: 'Instagram', href: socialLinks.instagram },
  { id: 'linkedin', label: 'LinkedIn', href: socialLinks.linkedin },
  { id: 'x', label: 'X (Twitter)', href: socialLinks.x },
] as const
