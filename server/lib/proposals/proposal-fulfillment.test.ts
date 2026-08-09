import { describe, expect, it } from 'vitest'
import {
  canCreateProposalForLead,
  isProposalCustomerActionable,
  isProposalPastValidity,
} from './proposal-fulfillment.js'

describe('proposal validity', () => {
  it('detects expired proposals', () => {
    const past = new Date('2020-01-01')
    expect(isProposalPastValidity(past, new Date('2026-01-01'))).toBe(true)
  })

  it('blocks customer action when expired', () => {
    expect(
      isProposalCustomerActionable('sent', new Date('2020-01-01'), new Date('2026-01-01')),
    ).toBe(false)
  })
})

describe('canCreateProposalForLead', () => {
  it('requires customer and non-lost lead', () => {
    expect(canCreateProposalForLead({ status: 'qualified', customerId: 'c' }).ok).toBe(true)
    expect(canCreateProposalForLead({ status: 'lost', customerId: 'c' }).ok).toBe(false)
    expect(canCreateProposalForLead({ status: 'new', customerId: null }).ok).toBe(false)
  })
})
