import { describe, expect, it } from 'vitest'
import { formatProposalReference } from './proposal-reference.js'

describe('formatProposalReference', () => {
  it('formats stable PROP references from uuid', () => {
    const ref = formatProposalReference('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    expect(ref).toBe('PROP-A1B2C3D4')
  })
})
