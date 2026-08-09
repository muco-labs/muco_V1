import { describe, expect, it } from 'vitest'
import { DEFAULT_CANONICAL_SITE_URL } from './canonical-site'

describe('canonical-site', () => {
  it('uses www production host', () => {
    expect(DEFAULT_CANONICAL_SITE_URL).toBe('https://www.mucolabs.com')
  })
})
