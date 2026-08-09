import { authRoutes } from '@/config/auth'

export type OAuthCallbackLocation = {
  pathname: string
  search: string
  hash: string
  hostname: string
}

/** Hosts where the SPA OAuth callback recovery guard runs. */
export function isOAuthCallbackRecoveryHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1') return true
  return host === 'mucolabs.com' || host.endsWith('.mucolabs.com')
}

export function hasOAuthCallbackQuery(search: string): boolean {
  const params = new URLSearchParams(search)
  return (
    params.has('code') ||
    params.has('error') ||
    params.has('error_description')
  )
}

export function shouldRecoverOAuthCallbackUrl(location: OAuthCallbackLocation): boolean {
  if (location.pathname === authRoutes.callback) return false
  if (!isOAuthCallbackRecoveryHost(location.hostname)) return false
  return hasOAuthCallbackQuery(location.search)
}

export function oauthCallbackRecoveryTarget(location: Pick<OAuthCallbackLocation, 'search' | 'hash'>): string {
  return `${authRoutes.callback}${location.search}${location.hash}`
}

/**
 * Redirect misplaced Supabase OAuth returns (e.g. Site URL `/?code=`) to `/auth/callback`
 * before React mounts. Returns true if a navigation was started.
 */
export function applyOAuthCallbackRecoveryIfNeeded(): boolean {
  if (typeof window === 'undefined') return false
  const location: OAuthCallbackLocation = {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    hostname: window.location.hostname,
  }
  if (!shouldRecoverOAuthCallbackUrl(location)) return false
  window.location.replace(oauthCallbackRecoveryTarget(location))
  return true
}
