export type FounderProfileStatus = 'pending_verification' | 'published'

/** Verified founder fields — populate only when confirmed. */
export type FounderProfile = {
  status: FounderProfileStatus
  name?: string
  title?: string
  introduction?: string
  vision?: string
  role?: string
  interests?: string[]
  story?: string
  image?: {
    src: string
    alt: string
  }
  links?: Array<{ label: string; href: string }>
}

export const founder: FounderProfile = {
  status: 'pending_verification',
  title: 'Founder',
  role: 'Leads product direction, technology standards and client delivery at MUCO LABS.',
  introduction:
    'Founder profile content will be published here once verified biographical details and imagery are approved.',
  vision:
    'Build MUCO LABS as a durable technology company from Erode—serving ambitious teams locally and globally with honest engineering.',
}
