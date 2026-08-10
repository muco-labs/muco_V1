import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { RouteAnalytics } from '@/components/analytics/RouteAnalytics'
import { LegacyPortalRedirect } from '@/components/portal/LegacyPortalRedirect'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { SiteOpening } from '@/components/opening/SiteOpening'
import { shouldPlaySiteOpening, preloadIntroBrandAssets } from '@/components/opening/site-opening-session'
import { StickyStartCta } from '@/components/conversion/StickyStartCta'
import { PageTransition } from '@/components/ui/PageTransition'
import styles from './MainLayout.module.css'

export function MainLayout() {
  const location = useLocation()
  const [introComplete, setIntroComplete] = useState(() => {
    if (typeof window === 'undefined') return true
    return !shouldPlaySiteOpening(window.location.pathname)
  })

  const onIntroComplete = useCallback(() => setIntroComplete(true), [])

  const introActive = !introComplete && location.pathname === '/'

  useEffect(() => {
    if (introActive) preloadIntroBrandAssets()
  }, [introActive])

  const revealHome = location.pathname === '/' && introComplete

  return (
    <div className={introActive ? styles.introActive : undefined}>
      <div className="aurora-bg" aria-hidden="true" />
      <RouteAnalytics />
      <LegacyPortalRedirect />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {!introComplete && location.pathname === '/' ? (
        <SiteOpening onComplete={onIntroComplete} />
      ) : null}
      <Navbar />
      <main
        id="main-content"
        className={`page-main ${revealHome ? styles.homeRevealed : ''}`}
        tabIndex={-1}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} routeKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <StickyStartCta />
      <ScrollRestoration />
    </div>
  )
}
