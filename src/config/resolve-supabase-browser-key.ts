/**
 * Resolves the Supabase API key for the browser `@supabase/supabase-js` client.
 *
 * Supabase exposes two public key types:
 * - JWT anon key (`eyJ…`) — required for auth methods (signInWithPassword, signUp, OAuth).
 * - Publishable key (`sb_publishable_…`) — not accepted by supabase-js auth; returns "Unregistered API key" (401).
 *
 * When both `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set, the JWT anon key must win.
 */
export function resolveSupabaseBrowserKey(
  anonKey: string | undefined,
  publishableKey: string | undefined,
): string | undefined {
  const anon = anonKey?.trim()
  const publishable = publishableKey?.trim()

  if (anon?.startsWith('eyJ')) return anon
  if (publishable?.startsWith('eyJ')) return publishable

  return anon || publishable || undefined
}
