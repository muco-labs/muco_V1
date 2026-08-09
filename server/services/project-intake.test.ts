import { describe, expect, it } from 'vitest'
import { projectIntakeSchema } from '../lib/validation/project-intake.js'
import { buildProjectDescription, buildIntakeMetadata, shapeCustomerProjectRequest } from './project-intake.service.js'

const basePayload = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+91 90000 00000',
  companyName: 'Acme',
  country: 'India',
  state: 'Tamil Nadu',
  city: 'Erode',
  website: 'https://example.com',
  primaryService: 'web-development' as const,
  additionalServices: ['seo' as const],
  requirement: 'We need a modern marketing website with clear service pages and contact flows.',
  objective: 'Generate qualified leads',
  budgetPreference: '25k_50k' as const,
  timelinePreference: '2_4_weeks' as const,
}

import { PROJECT_INTAKE_PAGE_SOURCE } from '../lib/intake/project-intake-constants.js'

describe('project intake constants', () => {
  it('uses start_project page source for customer portal filtering', () => {
    expect(PROJECT_INTAKE_PAGE_SOURCE).toBe('start_project')
  })
})

describe('projectIntakeSchema', () => {
  it('accepts a valid intake payload', () => {
    const parsed = projectIntakeSchema.safeParse(basePayload)
    expect(parsed.success).toBe(true)
  })

  it('requires custom service when primary is other', () => {
    const parsed = projectIntakeSchema.safeParse({
      ...basePayload,
      primaryService: 'other',
    })
    expect(parsed.success).toBe(false)
  })

  it('accepts other when custom primary is provided', () => {
    const parsed = projectIntakeSchema.safeParse({
      ...basePayload,
      primaryService: 'other',
      customPrimaryService: 'Custom integration work',
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts budget and timeline preferences', () => {
    const parsed = projectIntakeSchema.safeParse({
      ...basePayload,
      budgetPreference: 'not_decided',
      timelinePreference: 'flexible',
      budgetNotes: 'Open to discussion',
    })
    expect(parsed.success).toBe(true)
  })

  it('defaults additional services to empty array', () => {
    const { additionalServices: _additionalServices, ...rest } = basePayload
    const parsed = projectIntakeSchema.safeParse(rest)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.additionalServices).toEqual([])
    }
  })
})

describe('shapeCustomerProjectRequest', () => {
  it('does not expose internal CRM follow-up or notes fields', () => {
    const dto = shapeCustomerProjectRequest({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      status: 'new',
      name: 'Jane',
      email: 'jane@example.com',
      phone: null,
      company: null,
      website: null,
      serviceInterest: 'Web',
      budget: 'TBD',
      timeline: 'Flexible',
      projectDescription: 'Need a site',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    expect(dto).not.toHaveProperty('notes')
    expect(dto).not.toHaveProperty('followUpAt')
    expect(dto).not.toHaveProperty('assignedEmployeeId')
    expect(dto).not.toHaveProperty('salesNextAction')
    expect(Object.keys(dto).sort()).toEqual(
      [
        'budget',
        'company',
        'createdAt',
        'email',
        'id',
        'name',
        'phone',
        'projectDescription',
        'serviceInterest',
        'status',
        'timeline',
        'updatedAt',
        'website',
      ].sort(),
    )
  })
})

describe('buildIntakeMetadata', () => {
  it('stores structured intake on the lead notes field', () => {
    const meta = buildIntakeMetadata(projectIntakeSchema.parse(basePayload))
    expect(meta.primaryServiceSlug).toBe('web-development')
    expect(meta.additionalServiceSlugs).toEqual(['seo'])
  })
})

describe('buildProjectDescription', () => {
  it('includes requirement and optional sections', () => {
    const text = buildProjectDescription(
      projectIntakeSchema.parse({
        ...basePayload,
        targetAudience: 'SMB owners',
      }),
    )
    expect(text).toContain('marketing website')
    expect(text).toContain('Target audience')
  })
})
