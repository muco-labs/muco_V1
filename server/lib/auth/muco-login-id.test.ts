import { describe, expect, it } from 'vitest'
import {
  formatMucoLoginId,
  isLikelyMucoLoginId,
  mucoLoginIdSuffixFromUuid,
  normalizeMucoLoginId,
} from './muco-login-id.js'

describe('muco-login-id', () => {
  it('normalizes case and optional hyphen', () => {
    expect(normalizeMucoLoginId('cus-abc12345')).toBe('CUS-ABC12345')
    expect(normalizeMucoLoginId('CUSABC12345')).toBe('CUS-ABC12345')
  })

  it('formats role-prefixed ids', () => {
    expect(formatMucoLoginId('CUSTOMER', 'a1b2c3d4')).toBe('CUS-A1B2C3D4')
    expect(formatMucoLoginId('EMPLOYEE', 'xyz')).toBe('EMP-XYZ')
    expect(formatMucoLoginId('FOUNDER', 'xyz')).toBe('ADM-XYZ')
  })

  it('detects likely login ids', () => {
    expect(isLikelyMucoLoginId('CUS-ABC1234')).toBe(true)
    expect(isLikelyMucoLoginId('not-an-id')).toBe(false)
    expect(isLikelyMucoLoginId('user@example.com')).toBe(false)
  })

  it('builds suffix from uuid', () => {
    expect(mucoLoginIdSuffixFromUuid('550e8400-e29b-41d4-a716-446655440000')).toHaveLength(8)
  })
})
