const LOG_PREFIX = '[muco-auth-diag]'

// #region agent log
export function __agentDebugLog(location: string, hypothesisId: string, message: string, data: Record<string, unknown>, keepalive = false): void {
  try {
    const body = JSON.stringify({ sessionId: 'df9c2b', hypothesisId, location, message, data, timestamp: Date.now() })
    fetch('http://127.0.0.1:7265/ingest/2cc02e26-d96a-413d-bd2a-0c779d857bec', { method: 'POST', keepalive, headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'df9c2b' }, body }).catch(() => {})
    fetch('/__agent-debug-log', { method: 'POST', keepalive, headers: { 'Content-Type': 'application/json' }, body }).catch(() => {})
  } catch { /* ignore */ }
}
// #endregion

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
    .map((part) => part.trim().split('=')[0] ?? '')
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
