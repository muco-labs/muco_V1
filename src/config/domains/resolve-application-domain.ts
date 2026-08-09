import type { ApplicationDomain } from './types'

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

/**
 * Maps hostname → application domain.
 * Unknown hosts resolve to `unknown` (safe fallback, no privileged access).
 */
export function resolveApplicationDomain(hostname: string): ApplicationDomain {
  const host = normalizeHostname(hostname)

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return 'public'
  }

  if (host.startsWith('app.')) return 'customer'
  if (host.startsWith('team.')) return 'employee'
  if (host.startsWith('freelancers.')) return 'freelancer'
  if (host.startsWith('admin.')) return 'admin'

  if (host === 'www.mucolabs.com' || host === 'mucolabs.com') return 'public'
  if (host.endsWith('.vercel.app')) return 'public'

  return 'unknown'
}

export function isMucolabsProductionMarketingHost(hostname: string): boolean {
  const host = normalizeHostname(hostname)
  return host === 'www.mucolabs.com' || host === 'mucolabs.com'
}
