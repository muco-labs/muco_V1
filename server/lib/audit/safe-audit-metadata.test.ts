import { describe, expect, it } from 'vitest'
import { assertSafeAuditMetadata, isSafeAuditMetadataValue } from './safe-audit-metadata.js'

describe('safe audit metadata', () => {
  it('allows operational metadata', () => {
    expect(isSafeAuditMetadataValue({ projectId: 'p1', status: 'active' })).toBe(true)
  })

  it('rejects password-like keys', () => {
    expect(isSafeAuditMetadataValue({ password: 'x' })).toBe(false)
    expect(() => assertSafeAuditMetadata({ api_key: 'secret' })).toThrow()
  })

  it('rejects database connection strings', () => {
    expect(isSafeAuditMetadataValue({ note: 'postgresql://user:pass@host/db' })).toBe(false)
  })
})
