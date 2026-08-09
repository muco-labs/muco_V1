import { describe, expect, it } from 'vitest'
import { friendlyAdminPortalError } from '@/lib/admin/portal-errors'

describe('friendlyAdminPortalError', () => {
  it('maps forbidden errors', () => {
    expect(friendlyAdminPortalError('403 Forbidden')).toMatch(/do not have access/i)
  })
})
