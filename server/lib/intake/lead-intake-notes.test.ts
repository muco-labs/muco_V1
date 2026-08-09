import { describe, expect, it } from 'vitest'
import { parseStartProjectLeadNotes } from './lead-intake-notes.js'

describe('parseStartProjectLeadNotes', () => {
  it('parses intake JSON from start project leads', () => {
    const notes = JSON.stringify({
      intake: {
        intakeVersion: 1,
        primaryServiceSlug: 'web-development',
        additionalServiceSlugs: ['seo'],
        budgetPreference: '25k_50k',
        timelinePreference: '2_4_weeks',
        existingUrl: 'https://example.com',
      },
      additionalServices: ['SEO'],
    })
    const parsed = parseStartProjectLeadNotes(notes)
    expect(parsed?.primaryServiceSlug).toBe('web-development')
    expect(parsed?.additionalServices).toEqual(['SEO'])
    expect(parsed?.budgetPreference).toBe('25k_50k')
  })

  it('returns null for plain text notes', () => {
    expect(parseStartProjectLeadNotes('Called customer back')).toBeNull()
  })
})
