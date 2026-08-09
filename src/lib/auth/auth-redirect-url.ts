/**
 * Builds Supabase auth redirect URLs (OAuth callback, email links, etc.).
 * `authRedirectBase` is VITE_AUTH_REDIRECT_URL — origin only, not the full callback path.
 */
export function buildAuthRedirectUrl(
  path: string,
  authRedirectBase?: string,
  origin?: string,
): string | undefined {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  const trimmedBase = authRedirectBase?.trim()
  if (trimmedBase) {
    const base = trimmedBase.replace(/\/$/, '')
    if (normalizedPath === '/auth/callback' && base.endsWith('/auth/callback')) {
      return base
    }
    return `${base}${normalizedPath}`
  }

  if (origin) {
    return `${origin.replace(/\/$/, '')}${normalizedPath}`
  }

  return undefined
}
