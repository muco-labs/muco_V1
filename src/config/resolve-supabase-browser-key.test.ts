import { describe, expect, it } from 'vitest'
import { resolveSupabaseBrowserKey } from './resolve-supabase-browser-key'

const JWT_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiJ9.x'
const PUBLISHABLE = 'sb_publishable_test_key'

describe('resolveSupabaseBrowserKey', () => {
  it('returns JWT key when only anon is set', () => {
    expect(resolveSupabaseBrowserKey(JWT_ANON, undefined)).toBe(JWT_ANON)
  })

  it('returns publishable key when only publishable is set', () => {
    expect(resolveSupabaseBrowserKey(undefined, PUBLISHABLE)).toBe(PUBLISHABLE)
  })

  it('returns JWT key when both are set (production regression)', () => {
    expect(resolveSupabaseBrowserKey(JWT_ANON, PUBLISHABLE)).toBe(JWT_ANON)
  })

  it('returns undefined when neither is set', () => {
    expect(resolveSupabaseBrowserKey(undefined, undefined)).toBeUndefined()
    expect(resolveSupabaseBrowserKey('', '')).toBeUndefined()
  })
})
