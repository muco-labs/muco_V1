import { useEffect, useState } from 'react'
import { brandAssets } from '@/config/brand-assets'
import { site } from '@/config/site'
import { TechnicalBackdrop } from './TechnicalBackdrop'
import { INTRO_TIMING, preloadIntroBrandAssets } from './intro-timing'
import { markSiteOpeningSeen } from './site-opening-session'
import styles from './SiteOpening.module.css'

type SiteOpeningProps = {
  onComplete: () => void
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function SiteOpening({ onComplete }: SiteOpeningProps) {
  const [phase, setPhase] = useState<'logo' | 'wordmark' | 'exit'>('logo')
  const logoSrc = brandAssets.logoMark.src ?? brandAssets.logo.src

  useEffect(() => {
    preloadIntroBrandAssets()
  }, [])

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const { totalMs, wordmarkMs, exitMs, reducedTotalMs } = INTRO_TIMING
    const total = reduced ? reducedTotalMs : totalMs
    const t1 = window.setTimeout(() => setPhase('wordmark'), reduced ? 0 : wordmarkMs)
    const t2 = window.setTimeout(() => setPhase('exit'), reduced ? 40 : exitMs)
    const t3 = window.setTimeout(() => {
      markSiteOpeningSeen()
      onComplete()
    }, total)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  return (
    <div
      className={`${styles.overlay} ${phase === 'exit' ? styles.exit : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <TechnicalBackdrop intensity="intro" />
      <div className={styles.center}>
        <div className={`${styles.logoWrap} ${phase !== 'logo' ? styles.logoStable : ''}`}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className={styles.logoImg}
              width={512}
              height={512}
              decoding="sync"
              fetchPriority="high"
            />
          ) : (
            <span className={styles.mark} />
          )}
        </div>
        <p className={`${styles.wordmark} ${phase !== 'logo' ? styles.wordmarkVisible : ''}`}>
          {site.name}
        </p>
      </div>
    </div>
  )
}
