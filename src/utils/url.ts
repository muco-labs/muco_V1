const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript):/i

/** Rejects dangerous protocols for user-controlled or dynamic hrefs. */
export function isSafeExternalHref(href: string): boolean {
  const trimmed = href.trim()
  if (!trimmed) return false
  if (BLOCKED_PROTOCOLS.test(trimmed)) return false
  if (trimmed.startsWith('//')) {
    return true
  }
  try {
    const url = new URL(trimmed, 'https://example.invalid')
    return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:'
  } catch {
    return !trimmed.includes(':')
  }
}

/** Same-origin API paths and HTTPS URLs allowed for client requests. */
export function isAllowedApiUrl(url: string): boolean {
  if (url.startsWith('/api/')) {
    return true
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false
    }
    if (import.meta.env.PROD && parsed.protocol !== 'https:') {
      return false
    }
    return true
  } catch {
    return false
  }
}
