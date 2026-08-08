import { describe, expect, it } from 'vitest'
import { isErodeAttributedLead, isTamilNaduAttributedLead } from './constants.js'

describe('isErodeAttributedLead', () => {
  it('matches voluntary city', () => {
    expect(isErodeAttributedLead({ businessCity: 'Erode' })).toBe(true)
    expect(isErodeAttributedLead({ businessCity: 'Near Erode, TN' })).toBe(true)
  })

  it('matches /erode landing paths and page source', () => {
    expect(isErodeAttributedLead({ landingPath: '/erode/web-development' })).toBe(true)
    expect(isErodeAttributedLead({ pageSource: 'erode_local' })).toBe(true)
  })

  it('does not infer from empty data', () => {
    expect(isErodeAttributedLead({})).toBe(false)
    expect(isErodeAttributedLead({ businessCity: 'Chennai' })).toBe(false)
  })
})

describe('isTamilNaduAttributedLead', () => {
  it('matches known TN city names when provided', () => {
    expect(isTamilNaduAttributedLead('Coimbatore')).toBe(true)
    expect(isTamilNaduAttributedLead('Erode')).toBe(true)
  })

  it('returns false without city', () => {
    expect(isTamilNaduAttributedLead(null)).toBe(false)
    expect(isTamilNaduAttributedLead('')).toBe(false)
  })
})
