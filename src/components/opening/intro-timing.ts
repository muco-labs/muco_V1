/** Intro ~2s — logo → wordmark → exit → homepage reveal */
export const INTRO_TIMING = {
  totalMs: 2000,
  wordmarkMs: 480,
  exitMs: 1320,
  reducedTotalMs: 120,
} as const

export function preloadIntroBrandAssets(): void {
  const src = '/brand/muco-logo-mark.png'
  const img = new Image()
  img.src = src
  if (!document.querySelector(`link[rel="preload"][href="${src}"]`)) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  }
}
