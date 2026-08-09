import { describe, expect, it } from 'vitest'
import { friendlyAuthError } from './auth-errors'

describe('friendlyAuthError', () => {
  it('maps invalid credentials', () => {
    expect(friendlyAuthError({ message: 'Invalid login credentials', name: 'AuthApiError' })).toMatch(
      /email and password/i,
    )
  })

  it('uses fallback for unknown errors', () => {
    expect(friendlyAuthError(null, 'Fallback')).toBe('Fallback')
  })
})
