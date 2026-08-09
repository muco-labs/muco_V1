import { describe, expect, it } from 'vitest'
import { formatProjectRequestReference } from './project-request-reference'

describe('formatProjectRequestReference', () => {
  it('formats uuid into short customer reference', () => {
    expect(formatProjectRequestReference('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'REQ-A1B2C3D4',
    )
  })
})
