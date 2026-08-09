const STORAGE_KEY = 'muco-intro-seen-v1'

export { preloadIntroBrandAssets } from './intro-timing'

export function shouldPlaySiteOpening(pathname: string): boolean {
  if (pathname !== '/') return false
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return sessionStorage.getItem(STORAGE_KEY) !== '1'
}

export function markSiteOpeningSeen(): void {
  sessionStorage.setItem(STORAGE_KEY, '1')
}
