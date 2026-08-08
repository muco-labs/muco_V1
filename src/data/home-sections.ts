export const homeSectionIds = {
  hero: 'hero',
  whatWeDo: 'what-we-do',
  services: 'services',
  why: 'why-muco-labs',
  work: 'selected-work',
  process: 'process',
  technology: 'technology-ai',
  industries: 'industries',
  proof: 'proof',
  finalCta: 'start-project',
} as const

export type HomeSectionId =
  (typeof homeSectionIds)[keyof typeof homeSectionIds]
