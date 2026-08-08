import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
])

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true
  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === '::1') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (normalized.startsWith('fe80')) return true
  return false
}

export function isBlockedIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIpv4(ip)
  if (isIP(ip) === 6) return isPrivateIpv6(ip)
  return true
}

export function normalizeAuditUrl(input: string): URL {
  let trimmed = input.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`
  }
  const url = new URL(trimmed)
  url.hash = ''
  return url
}

export function validatePublicHttpUrl(input: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL
  try {
    url = normalizeAuditUrl(input)
  } catch {
    return { ok: false, error: 'Enter a valid website URL.' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs are allowed.' }
  }

  if (!url.hostname) {
    return { ok: false, error: 'URL must include a hostname.' }
  }

  const host = url.hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost')) {
    return { ok: false, error: 'This hostname is not allowed.' }
  }

  if (isIP(host)) {
    if (isBlockedIp(host)) {
      return { ok: false, error: 'Private or local IP addresses are not allowed.' }
    }
  }

  return { ok: true, url }
}

export async function assertSafeResolvedHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error('Blocked hostname')
  }
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new Error('Blocked IP')
    return
  }
  const records = await lookup(host, { all: true })
  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error('Hostname resolves to a private or local address')
    }
  }
}

export function canonicalizeCrawlUrl(base: URL, href: string): string | null {
  try {
    const resolved = new URL(href, base)
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return null
    if (resolved.hostname.toLowerCase() !== base.hostname.toLowerCase()) return null
    resolved.hash = ''
    return resolved.toString()
  } catch {
    return null
  }
}
