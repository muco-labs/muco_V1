import type { ApplicationDomain } from './types'

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

function resolveMucolabsApplicationDomain(host: string): ApplicationDomain | null {
  if (host === 'www.mucolabs.com' || host === 'mucolabs.com') {
    return 'public'
  }
  if (!host.endsWith('.mucolabs.com')) {
    return null
  }
  if (host.startsWith('app.')) return 'customer'
  if (host.startsWith('team.')) return 'employee'
  if (host.startsWith('freelancers.')) return 'freelancer'
  if (host.startsWith('admin.')) return 'admin'
  return 'unknown'
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

  const mucolabs = resolveMucolabsApplicationDomain(host)
  if (mucolabs !== null) {
    return mucolabs
  }

  // Preview / deploy hosts keep path-prefix public routing (not production subdomains)
  if (host.endsWith('.vercel.app') || host.endsWith('.netlify.app')) return 'public'

  return 'unknown'
}

export function isMucolabsProductionMarketingHost(hostname: string): boolean {
  const host = normalizeHostname(hostname)
  return host === 'www.mucolabs.com' || host === 'mucolabs.com'
}
