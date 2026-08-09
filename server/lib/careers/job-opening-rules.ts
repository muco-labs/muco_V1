const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeCareerJobSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export function isValidCareerJobSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 120 && SLUG_PATTERN.test(slug)
}

export function isJobOpeningAcceptingApplications(job: {
  status: string
  closesAt: Date | null
}): boolean {
  if (job.status !== 'published') return false
  if (job.closesAt && job.closesAt < new Date()) return false
  return true
}
