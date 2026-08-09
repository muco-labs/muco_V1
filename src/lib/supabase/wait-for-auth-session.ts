import type { SupabaseClient, Session } from '@supabase/supabase-js'

/**
 * Wait for Supabase client initialization (PKCE / implicit URL handling) before reading session.
 */
export async function waitForAuthSession(client: SupabaseClient): Promise<{
  session: Session | null
  error: Error | null
}> {
  const init = await client.auth.initialize()
  if (init.error) {
    return { session: null, error: init.error }
  }
  const { data, error } = await client.auth.getSession()
  if (error) {
    return { session: null, error }
  }
  return { session: data.session ?? null, error: null }
}
