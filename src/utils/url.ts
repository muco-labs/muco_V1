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

/** Contact and public API calls must use HTTPS in production. */
export function isAllowedApiUrl(url: string): boolean {
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
