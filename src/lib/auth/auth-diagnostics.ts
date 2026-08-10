const LOG_PREFIX = '[muco-auth-diag]'

/** Pin diagnostics for the rest of the tab (e.g. after OAuth strips query params). */
export function persistAuthDiagnosticsFlag(): void {
  if (typeof window === 'undefined') return
  try {
    if (new URLSearchParams(window.location.search).get('auth_diag') === '1') {
      sessionStorage.setItem('muco_auth_diag', '1')
    }
  } catch {
    /* ignore */
  }
}

/** Enable with `?auth_diag=1` or `sessionStorage.setItem('muco_auth_diag', '1')`. */
export function isAuthDiagnosticsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('auth_diag') === '1') {
      return true
    }
    return sessionStorage.getItem('muco_auth_diag') === '1'
  } catch {
    return false
  }
}

export function logAuthDiag(
  step: string,
  payload: Record<string, string | boolean | number | null | undefined>,
): void {
  if (!isAuthDiagnosticsEnabled()) return
  console.info(LOG_PREFIX, step, {
    hostname: typeof window !== 'undefined' ? window.location.hostname : null,
    pathname: typeof window !== 'undefined' ? window.location.pathname : null,
    ...payload,
  })
}

export function listSbStorageKeyNames(): string[] {
  if (typeof document === 'undefined') return []
  return document.cookie
    .split(';')
    .map((part) => {
      const trimmed = part.trim()
      const eq = trimmed.indexOf('=')
      const raw = eq >= 0 ? trimmed.slice(0, eq).trim() : trimmed
      try {
        return decodeURIComponent(raw)
      } catch {
        return raw
      }
    })
    .filter((name) => name.startsWith('sb-'))
}

/** True when a cookie name exists for a PKCE verifier key (no value read). */
export function hasSbPkceVerifierCookieKey(): boolean {
  return listSbStorageKeyNames().some((name) => {
    const decoded = (() => {
      try {
        return decodeURIComponent(name)
      } catch {
        return name
      }
    })()
    return decoded.endsWith('-code-verifier') || name.includes('-code-verifier')
  })
}
