/**
 * Marks content that is illustrative or awaiting founder assets.
 * UI should label these clearly—never present as verified client metrics.
 */
export const contentBoundaries = {
  founderPhotoPending: true,
  teamPhotosPending: true,
  portfolioScreenshotsMostlyPlaceholder: true,
} as const
