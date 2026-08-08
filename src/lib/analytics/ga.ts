import { env } from '@/config/env'
import type { AnalyticsEventName } from '@/lib/analytics/events'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

export function isAnalyticsEnabled(): boolean {
  return Boolean(env.gaMeasurementId)
}

export function initGoogleAnalytics(): void {
  const measurementId = env.gaMeasurementId
  if (!measurementId || initialized || typeof document === 'undefined') {
    return
  }

  initialized = true
  window.dataLayer = window.dataLayer ?? []

  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }

  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)
}

export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled() || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  })
}

export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, string | number | boolean>,
): void {
  if (!isAnalyticsEnabled() || !window.gtag) return
  window.gtag('event', name, params ?? {})
}
