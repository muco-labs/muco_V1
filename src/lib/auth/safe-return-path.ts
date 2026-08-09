import { portalRoutes } from '@/config/auth'
import { hasDisallowedControlChars } from '@/lib/validation/control-char'

const MAX_RETURN_LENGTH = 512

/**
 * Resolves a post-auth navigation target for the customer portal only.
 * Rejects protocol-relative URLs, external URLs, and non-customer paths.
 */
export function resolveSafeCustomerReturnPath(
  from: string | undefined | null,
  fallback: string = portalRoutes.customer,
): string {
  if (!from || typeof from !== 'string') return fallback

  const trimmed = from.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_RETURN_LENGTH) return fallback
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (/^https?:/i.test(trimmed)) return fallback
  if (trimmed.includes('\\')) return fallback
  if (hasDisallowedControlChars(trimmed)) return fallback

  const queryIndex = trimmed.indexOf('?')
  const pathOnly = queryIndex === -1 ? trimmed : trimmed.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : trimmed.slice(queryIndex)

  let decodedPath = pathOnly
  try {
    decodedPath = decodeURIComponent(pathOnly)
  } catch {
    return fallback
  }

  if (!pathOnly.startsWith('/app')) return fallback
  if (pathOnly.includes('..') || decodedPath.includes('..')) return fallback
  if (decodedPath.includes('\\')) return fallback

  return `${pathOnly}${search}`
}
