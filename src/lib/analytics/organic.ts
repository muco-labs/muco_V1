import { analyticsEvents, trackEvent } from '@/lib/analytics'

const ORGANIC_REFERRER_PATTERN =
  /google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|yandex\.|ecosia\./i

const SESSION_KEY = 'muco_organic_landing_tracked'

export function trackOrganicLandingOnce(path: string): void {
  if (typeof sessionStorage === 'undefined' || typeof document === 'undefined') return
  if (sessionStorage.getItem(SESSION_KEY)) return

  const referrer = document.referrer
  if (!referrer || !ORGANIC_REFERRER_PATTERN.test(referrer)) return

  sessionStorage.setItem(SESSION_KEY, '1')
  trackEvent(analyticsEvents.organicLanding, { landing_path: path })
}
