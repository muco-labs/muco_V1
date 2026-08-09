export type ParsedStartProjectIntake = {
  primaryServiceSlug: string | null
  additionalServiceSlugs: string[]
  additionalServices: string[]
  budgetPreference: string | null
  timelinePreference: string | null
  existingUrl: string | null
}

export function parseStartProjectLeadNotes(notes: string | null | undefined): ParsedStartProjectIntake | null {
  if (!notes?.trim()) return null
  try {
    const parsed = JSON.parse(notes) as {
      intake?: {
        primaryServiceSlug?: string
        additionalServiceSlugs?: string[]
        budgetPreference?: string
        timelinePreference?: string
        existingUrl?: string | null
      }
      additionalServices?: string[]
    }
    if (!parsed.intake && !parsed.additionalServices?.length) return null
    return {
      primaryServiceSlug: parsed.intake?.primaryServiceSlug ?? null,
      additionalServiceSlugs: parsed.intake?.additionalServiceSlugs ?? [],
      additionalServices: parsed.additionalServices ?? [],
      budgetPreference: parsed.intake?.budgetPreference ?? null,
      timelinePreference: parsed.intake?.timelinePreference ?? null,
      existingUrl: parsed.intake?.existingUrl ?? null,
    }
  } catch {
    return null
  }
}
