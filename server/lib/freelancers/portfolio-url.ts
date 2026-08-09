import { AppError } from '../errors.js'

const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:', 'file:'])

export function parsePortfolioUrls(urls: string[]): string[] {
  const normalized: string[] = []
  for (const raw of urls) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    let parsed: URL
    try {
      parsed = new URL(trimmed)
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Portfolio URL is not valid.', 400)
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new AppError('VALIDATION_ERROR', 'Portfolio URLs must use http or https.', 400)
    }
    if (BLOCKED_PROTOCOLS.has(parsed.protocol)) {
      throw new AppError('VALIDATION_ERROR', 'Portfolio URL is not allowed.', 400)
    }
    if (trimmed.length > 500) {
      throw new AppError('VALIDATION_ERROR', 'Portfolio URL is too long.', 400)
    }
    normalized.push(parsed.toString())
  }
  if (normalized.length > 5) {
    throw new AppError('VALIDATION_ERROR', 'At most five portfolio URLs are allowed.', 400)
  }
  return normalized
}

export function serializePortfolioUrls(urls: string[] | null | undefined): string | null {
  if (!urls?.length) return null
  return JSON.stringify(urls)
}

export function deserializePortfolioUrls(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((u) => typeof u === 'string')
  } catch {
    return []
  }
}
