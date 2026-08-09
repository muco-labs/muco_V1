import { describe, expect, it } from 'vitest'
import { notificationBelongsToUser } from './recipient-scope.js'

describe('notification recipient scope', () => {
  it('only allows reads for the owning user', () => {
    expect(notificationBelongsToUser('user-a', 'user-a')).toBe(true)
    expect(notificationBelongsToUser('user-a', 'user-b')).toBe(false)
  })
})
