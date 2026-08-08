import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initGoogleAnalytics, trackPageView } from '@/lib/analytics'

export function RouteAnalytics() {
  const location = useLocation()

  useEffect(() => {
    initGoogleAnalytics()
  }, [])

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`, document.title)
  }, [location.pathname, location.search])

  return null
}
