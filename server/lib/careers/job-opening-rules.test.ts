import { describe, expect, it } from 'vitest'
import {
  isJobOpeningAcceptingApplications,
  isValidCareerJobSlug,
  normalizeCareerJobSlug,
} from './job-opening-rules.js'

describe('normalizeCareerJobSlug', () => {
  it('produces URL-safe slugs', () => {
    expect(normalizeCareerJobSlug('  Frontend Developer  ')).toBe('frontend-developer')
  })
})

describe('isValidCareerJobSlug', () => {
  it('accepts valid slugs', () => {
    expect(isValidCareerJobSlug('frontend-developer')).toBe(true)
  })

  it('rejects invalid slugs', () => {
    expect(isValidCareerJobSlug('')).toBe(false)
    expect(isValidCareerJobSlug('Bad_Slug')).toBe(false)
  })
})

describe('isJobOpeningAcceptingApplications', () => {
  it('accepts published jobs without close date', () => {
    expect(
      isJobOpeningAcceptingApplications({ status: 'published', closesAt: null }),
    ).toBe(true)
  })

  it('rejects closed and draft jobs', () => {
    expect(isJobOpeningAcceptingApplications({ status: 'closed', closesAt: null })).toBe(false)
    expect(isJobOpeningAcceptingApplications({ status: 'draft', closesAt: null })).toBe(false)
  })

  it('rejects published jobs past closing date', () => {
    const past = new Date(Date.now() - 86_400_000)
    expect(isJobOpeningAcceptingApplications({ status: 'published', closesAt: past })).toBe(false)
  })
})
