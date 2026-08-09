const STORAGE_KEY = 'muco_oauth_return'

export function persistOAuthReturnPath(from: string | undefined) {
  if (typeof sessionStorage === 'undefined' || !from?.trim()) return
  sessionStorage.setItem(STORAGE_KEY, from.trim())
}

export function consumeOAuthReturnPath(): string | undefined {
  if (typeof sessionStorage === 'undefined') return undefined
  const value = sessionStorage.getItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  return value ?? undefined
}
