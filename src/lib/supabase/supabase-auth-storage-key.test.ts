import { describe, expect, it } from 'vitest'
import { resolveSupabaseAuthStorageKey } from './supabase-auth-storage-key'

describe('resolveSupabaseAuthStorageKey', () => {
  it('uses JWT ref when present', () => {
    const anon =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bWF3ZXVubG5scGxscnp6c2NxIiwicm9sZSI6ImFub24ifQ.sig'
    expect(
      resolveSupabaseAuthStorageKey('https://ltmaweunlnlpllrzzscq.supabase.co', anon),
    ).toBe('sb-ltmaweunlnlpllrzzscq-auth-token')
  })

  it('falls back to hostname ref', () => {
    expect(
      resolveSupabaseAuthStorageKey(
        'https://ltmaweunlnlpllrzzscq.supabase.co',
        'not-a-jwt',
      ),
    ).toBe('sb-ltmaweunlnlpllrzzscq-auth-token')
  })
})
