import { describe, expect, it } from 'vitest'
import {
  isErodeAttributedLead,
  isIndiaAttributedLead,
  isTamilNaduAttributedLead,
} from '../market/constants.js'

describe('isErodeAttributedLead', () => {
  it('matches voluntary city and /erode paths', () => {
    expect(isErodeAttributedLead({ businessCity: 'Erode' })).toBe(true)
    expect(isErodeAttributedLead({ landingPath: '/erode/web-development' })).toBe(true)
  })
})

describe('isTamilNaduAttributedLead', () => {
  it('matches TN cities and hub path', () => {
    expect(isTamilNaduAttributedLead({ businessCity: 'Coimbatore' })).toBe(true)
    expect(isTamilNaduAttributedLead({ businessState: 'Tamil Nadu' })).toBe(true)
    expect(isTamilNaduAttributedLead({ landingPath: '/tamil-nadu' })).toBe(true)
  })
})

describe('isIndiaAttributedLead', () => {
  it('includes TN and national signals', () => {
    expect(isIndiaAttributedLead({ businessCity: 'Bengaluru' })).toBe(true)
    expect(isIndiaAttributedLead({ businessState: 'Karnataka' })).toBe(true)
    expect(isIndiaAttributedLead({ landingPath: '/india' })).toBe(true)
    expect(isIndiaAttributedLead({ pageSource: 'india_hub' })).toBe(true)
  })

  it('does not infer without data', () => {
    expect(isIndiaAttributedLead({})).toBe(false)
  })
})
