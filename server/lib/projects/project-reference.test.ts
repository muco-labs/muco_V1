import { describe, expect, it } from 'vitest'
import { formatProjectReference } from './project-reference.js'

describe('formatProjectReference', () => {
  it('formats stable PROJ references from uuid', () => {
    const ref = formatProjectReference('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    expect(ref).toBe('PROJ-A1B2C3D4')
  })
})
