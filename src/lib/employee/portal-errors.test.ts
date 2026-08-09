import { describe, expect, it } from 'vitest'
import { taskStatusTone } from '@/lib/employee/portal-errors'
import { friendlyEmployeePortalError } from '@/lib/employee/portal-errors'

describe('friendlyEmployeePortalError', () => {
  it('maps forbidden errors', () => {
    expect(friendlyEmployeePortalError('Forbidden')).toMatch(/do not have access/i)
  })
})

describe('taskStatusTone', () => {
  it('highlights blocked and done', () => {
    expect(taskStatusTone('blocked')).toBe('danger')
    expect(taskStatusTone('done')).toBe('success')
  })
})
