const LOG_PREFIX = '[muco-auth-diag]'

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
