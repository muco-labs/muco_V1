import { describe, expect, it } from 'vitest'
import { resolveSupabaseProjectUrl } from './resolve-supabase-project-url'

const anon =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bWF3ZXVubG5scGxscnp6c2NxIiwicm9sZSI6ImFub24ifQ.sig'

describe('resolveSupabaseProjectUrl', () => {
  it('keeps valid supabase.co API URL', () => {
    expect(
      resolveSupabaseProjectUrl('https://ltmaweunlnlpllrzzscq.supabase.co', anon),
    ).toBe('https://ltmaweunlnlpllrzzscq.supabase.co')
  })

  it('rewrites dashboard project URL to API URL', () => {
    expect(
      resolveSupabaseProjectUrl(
        'https://supabase.com/dashboard/project/ltmaweunlnlpllrzzscq',
        anon,
      ),
    ).toBe('https://ltmaweunlnlpllrzzscq.supabase.co')
  })

  it('falls back to JWT ref when URL missing', () => {
    expect(resolveSupabaseProjectUrl(undefined, anon)).toBe(
      'https://ltmaweunlnlpllrzzscq.supabase.co',
    )
  })
})
