import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveLegacyPortalRedirectUrl } from '@/config/domains'

/**
 * On www.mucolabs.com, sends legacy /app, /team, /admin paths to portal subdomains.
 */
export function LegacyPortalRedirect() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const target = resolveLegacyPortalRedirectUrl(
      window.location.hostname,
      location.pathname,
      location.search,
    )
    if (target) {
      window.location.replace(target)
    }
  }, [location.pathname, location.search])

  return null
}
