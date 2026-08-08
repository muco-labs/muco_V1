import { describe, expect, it } from 'vitest'
import { isInternationalAttributedLead } from './constants.js'
import { normalizeProposalCurrency } from '../currency/constants.js'

describe('isInternationalAttributedLead', () => {
  it('matches hub and tier-1 country hints', () => {
    expect(isInternationalAttributedLead({ landingPath: '/international' })).toBe(true)
    expect(isInternationalAttributedLead({ businessCountry: 'United States' })).toBe(true)
    expect(isInternationalAttributedLead({ pageSource: 'international_hub' })).toBe(true)
  })

  it('does not infer without signals', () => {
    expect(isInternationalAttributedLead({})).toBe(false)
  })
})

describe('normalizeProposalCurrency', () => {
  it('defaults unknown codes to INR', () => {
    expect(normalizeProposalCurrency('usd')).toBe('USD')
    expect(normalizeProposalCurrency('fake')).toBe('INR')
  })
})
