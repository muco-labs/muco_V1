import { describe, expect, it } from 'vitest'
import {
  createCareerApplicationSchema,
  updateCareerApplicationStatusSchema,
  careerApplicationStatuses,
} from './careers.js'

const valid = {
  fullName: 'Alex Rivera',
  email: 'alex@example.com',
  phone: '+91 90000 00000',
  city: 'Erode',
  country: 'India',
  roleInterest: 'Frontend Developer',
  applicationType: 'full_time' as const,
  experienceLevel: 'Mid-level',
  skills: 'React, TypeScript, CSS',
  portfolioUrl: 'https://example.com',
  introduction: 'I build accessible web interfaces and enjoy working with product teams on meaningful software.',
  availability: 'Available to start in 4 weeks',
}

describe('createCareerApplicationSchema', () => {
  it('accepts a valid application', () => {
    expect(createCareerApplicationSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid portfolio URL', () => {
    const parsed = createCareerApplicationSchema.safeParse({
      ...valid,
      portfolioUrl: 'not-a-url',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects honeypot website field', () => {
    const parsed = createCareerApplicationSchema.safeParse({
      ...valid,
      website: 'spam',
    })
    expect(parsed.success).toBe(false)
  })

  it('accepts general application type', () => {
    const parsed = createCareerApplicationSchema.safeParse({
      ...valid,
      applicationType: 'general',
      roleInterest: 'General Application',
    })
    expect(parsed.success).toBe(true)
  })
})

describe('updateCareerApplicationStatusSchema', () => {
  it('accepts valid workflow statuses', () => {
    for (const status of careerApplicationStatuses) {
      expect(updateCareerApplicationStatusSchema.safeParse({ status }).success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    expect(updateCareerApplicationStatusSchema.safeParse({ status: 'hired' }).success).toBe(false)
  })
})
