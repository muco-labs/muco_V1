import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { customerNavMore, customerNavPrimary, customerPortalPaths } from '@/config/customer-portal'
import { authRoutes } from '@/config/auth'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/Button'
import styles from './CustomerAppLayout.module.css'

export function CustomerAppLayout() {
  const { profile, signOut } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!navOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navOpen])

  return (
    <>
      <PageMeta
        documentTitle="Customer app | MUCO LABS"
        description="MUCO LABS customer portal — projects, invoices, and support."
        path={customerPortalPaths.root}
        noIndex
      />
      <div className={styles.shell}>
        <div className="aurora-bg" aria-hidden="true" />
        <a href="#customer-main" className={styles.skipLink}>
          Skip to main content
        </a>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <Link to={customerPortalPaths.root} className={styles.brand}>
              MUCO LABS <span>Customer</span>
            </Link>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={navOpen}
              aria-controls="customer-nav"
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? 'Close' : 'Menu'}
            </button>
            <div className={styles.topActions}>
              <span className={styles.userChip}>{profile?.fullName ?? profile?.email}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <div className={styles.body}>
          {navOpen ? (
            <button
              type="button"
              className={styles.navBackdrop}
              aria-label="Close menu"
              onClick={() => setNavOpen(false)}
            />
          ) : null}
          <nav
            id="customer-nav"
            className={`${styles.nav} ${navOpen ? styles.navOpen : ''}`}
            aria-label="Customer application"
          >
            <ul>
              {customerNavPrimary.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={'end' in item ? item.end : false}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                    onClick={() => setNavOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <p className={styles.navGroupLabel}>More</p>
            <ul>
              {customerNavMore.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                    onClick={() => setNavOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link className={styles.marketingLink} to="/">
              Back to mucolabs.com
            </Link>
          </nav>

          <main id="customer-main" className={styles.main} tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}

export function CustomerSignInHint() {
  return (
    <p className={styles.hint}>
      <Link className="link-underline" to={authRoutes.signIn}>
        Sign in
      </Link>{' '}
      to access your customer dashboard.
    </p>
  )
}
