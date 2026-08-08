import { AnimatePresence } from 'framer-motion'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { RouteAnalytics } from '@/components/analytics/RouteAnalytics'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { StickyStartCta } from '@/components/conversion/StickyStartCta'
import { PageTransition } from '@/components/ui/PageTransition'

export function MainLayout() {
  const location = useLocation()

  return (
    <>
      <RouteAnalytics />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="page-main" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} routeKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <StickyStartCta />
      <ScrollRestoration />
    </>
  )
}
