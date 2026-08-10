/**
 * Supabase auth-js storage key must match project ref (sb-{ref}-auth-token).
 * Wrong keys break PKCE verifier read on OAuth callback.
 */
export function extractSupabaseProjectRefFromAnonKey(anonKey: string): string | null {
  try {
    const segment = anonKey.split('.')[1]
    if (!segment) return null
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized)) as { ref?: string }
    const ref = payload.ref?.trim()
    return ref || null
  } catch {
    return null
  }
}

export function extractSupabaseProjectRefFromUrl(supabaseUrl: string): string | null {
  try {
    const host = new URL(supabaseUrl.trim()).hostname.toLowerCase()
    const ref = host.split('.')[0]
    if (!ref || ref === 'supabase') return null
    return ref
  } catch {
    return null
  }
}

export function resolveSupabaseAuthStorageKey(
  supabaseUrl: string,
  anonKey: string,
): string {
  const fromJwt = extractSupabaseProjectRefFromAnonKey(anonKey)
  const fromUrl = extractSupabaseProjectRefFromUrl(supabaseUrl)
  const ref = fromJwt ?? fromUrl ?? 'supabase'
  return `sb-${ref}-auth-token`
}
