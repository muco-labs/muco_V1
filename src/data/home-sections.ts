export const homeSectionIds = {
  hero: 'hero',
  intro: 'intro',
  capabilities: 'capabilities',
  services: 'services',
  why: 'why-muco-labs',
  work: 'selected-work',
  process: 'process',
  technology: 'technology-ai',
  industries: 'industries',
  local: 'local',
  finalCta: 'start-project',
} as const

export type HomeSectionId =
  (typeof homeSectionIds)[keyof typeof homeSectionIds]
