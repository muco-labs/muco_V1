function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '')
}

function projectRefFromAnonKey(anonKey: string): string | null {
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

/**
 * Supabase API base URL for `@supabase/supabase-js`.
 * Vercel env sometimes stores the dashboard link instead of `https://{ref}.supabase.co`.
 */
export function resolveSupabaseProjectUrl(
  configuredUrl: string | undefined,
  anonKey: string | undefined,
): string | undefined {
  const trimmed = configuredUrl?.trim()
  if (trimmed) {
    try {
      const host = new URL(trimmed).hostname.toLowerCase()
      if (host.endsWith('.supabase.co')) {
        return trimTrailingSlash(trimmed)
      }
    } catch {
      /* invalid URL — fall through */
    }

    const dashboardRef = trimmed.match(/project\/([a-z0-9]+)/i)?.[1]
    if (dashboardRef) {
      return `https://${dashboardRef}.supabase.co`
    }
  }

  const ref = anonKey ? projectRefFromAnonKey(anonKey) : null
  if (ref) return `https://${ref}.supabase.co`

  return trimmed ? trimTrailingSlash(trimmed) : undefined
}
