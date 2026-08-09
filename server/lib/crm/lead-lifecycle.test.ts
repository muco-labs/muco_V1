import { describe, expect, it } from 'vitest'
import {
  canTransitionLeadStatus,
  isLeadEligibleForConversion,
  LEAD_CONVERTIBLE_STATUSES,
} from './lead-lifecycle.js'

describe('canTransitionLeadStatus', () => {
  it('allows forward pipeline moves', () => {
    expect(canTransitionLeadStatus('new', 'contacted')).toBe(true)
    expect(canTransitionLeadStatus('contacted', 'qualified')).toBe(true)
    expect(canTransitionLeadStatus('proposal', 'won')).toBe(true)
  })

  it('blocks skipping stages', () => {
    expect(canTransitionLeadStatus('new', 'won')).toBe(false)
    expect(canTransitionLeadStatus('new', 'proposal')).toBe(false)
  })

  it('allows lost reopen to contacted', () => {
    expect(canTransitionLeadStatus('lost', 'contacted')).toBe(true)
  })

  it('blocks changes from archived', () => {
    expect(canTransitionLeadStatus('archived', 'new')).toBe(false)
  })
})

describe('isLeadEligibleForConversion', () => {
  it('matches late-stage statuses only', () => {
    for (const status of LEAD_CONVERTIBLE_STATUSES) {
      expect(isLeadEligibleForConversion(status)).toBe(true)
    }
    expect(isLeadEligibleForConversion('new')).toBe(false)
    expect(isLeadEligibleForConversion('qualified')).toBe(false)
  })
})
