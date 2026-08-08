import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initGoogleAnalytics, trackPageView } from '@/lib/analytics'
import { captureAttributionFromSearch } from '@/lib/analytics/attribution'
import { trackOrganicLandingOnce } from '@/lib/analytics/organic'

export function RouteAnalytics() {
  const location = useLocation()

  useEffect(() => {
    initGoogleAnalytics()
  }, [])

  useEffect(() => {
    captureAttributionFromSearch(location.search, location.pathname)
    trackOrganicLandingOnce(`${location.pathname}${location.search}`)
    trackPageView(`${location.pathname}${location.search}`, document.title)
  }, [location.pathname, location.search])

  return null
}
