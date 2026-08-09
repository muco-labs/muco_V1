import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { HiBars3, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2'
import { authRoutes } from '@/config/auth'
import { useAuth } from '@/contexts/auth-context'
import {
  resolveMarketingNavbarAccountHref,
  resolveMarketingNavbarAccountLabel,
} from '@/lib/auth/marketing-navbar-account'
import { routePaths } from '@/config/routes'
import { site } from '@/config/site'
import { brandAssets } from '@/config/brand-assets'
import { primaryNav } from '@/data/navigation'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'
import { NavDropdown, NavPlainLink } from '@/components/layout/NavDropdown'
import { SiteSearchDialog } from '@/components/layout/SiteSearchDialog'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/utils/cn'
import styles from './Navbar.module.css'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { theme, toggle: toggleTheme } = useTheme()
  const { loading: authLoading, session, user, profile, signOut, canAccessPortal } = useAuth()
  const signedIn = Boolean(session)
  const accountLabel = resolveMarketingNavbarAccountLabel({
    profile,
    email: user?.email,
  })
  const accountHref = signedIn
    ? resolveMarketingNavbarAccountHref(profile, canAccessPortal)
    : authRoutes.signIn

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className={cn(styles.header, scrolled && styles.scrolled)}>
        <div className={`shell ${styles.bar}`}>
        <Link to={routePaths.home} className={styles.brand} aria-label={`${site.name} home`}>
          {brandAssets.logo.status === 'available' && brandAssets.logo.src ? (
            <span className={styles.brandLogoSlot}>
              <img
                src={brandAssets.logo.src}
                alt=""
                className={styles.brandLogo}
                width={512}
                height={512}
                decoding="async"
              />
            </span>
          ) : (
            <span className={styles.mark} aria-hidden="true" />
          )}
          <span>{site.name}</span>
        </Link>

          <nav className={styles.desktopNav} aria-label="Primary">
            <ul>
              {primaryNav.map((item) =>
                'children' in item && item.children ? (
                  <NavDropdown key={item.label} item={item} />
                ) : (
                  <NavPlainLink key={item.href} href={item.href!} label={item.label} />
                ),
              )}
            </ul>
          </nav>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Search site"
              onClick={() => setSearchOpen(true)}
            >
              <HiMagnifyingGlass aria-hidden />
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className={styles.auth}>
              {authLoading ? (
                <span className={styles.authMuted} aria-hidden>
                  …
                </span>
              ) : signedIn ? (
                <>
                  <a className={styles.authLink} href={accountHref}>
                    {accountLabel}
                  </a>
                  <button
                    type="button"
                    className={styles.authSignOut}
                    onClick={() => void signOut()}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to={authRoutes.signIn}
                  className={styles.authLink}
                  onClick={() => trackEvent(analyticsEvents.signInClick)}
                >
                  Sign in
                </Link>
              )}
            </div>
            <Button
              to={routePaths.contact}
              variant="secondary"
              size="sm"
              trackEvent={analyticsEvents.contactClick}
            >
              Contact us
            </Button>
            <Button
              to={startProjectHref({ source: 'navbar' })}
              size="sm"
              trackEvent={analyticsEvents.startProjectClick}
              trackParams={{ source: 'navbar' }}
            >
              Start a project
            </Button>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              {open ? <HiXMark /> : <HiBars3 />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(styles.mobileBackdrop, open && styles.mobileBackdropOpen)}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div
        id="mobile-nav"
        className={cn(styles.mobile, open && styles.mobileOpen)}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="shell">
          <ul className={styles.mobileList}>
            {primaryNav.map((item) =>
              'children' in item && item.children ? (
                item.children.map((child) => (
                  <li key={child.href}>
                    <NavLink to={child.href} onClick={() => setOpen(false)}>
                      {child.label}
                    </NavLink>
                  </li>
                ))
              ) : (
                <li key={item.href}>
                  <NavLink to={item.href!} onClick={() => setOpen(false)}>
                    {item.label}
                  </NavLink>
                </li>
              ),
            )}
            <li>
              <NavLink to={routePaths.contact} onClick={() => setOpen(false)}>
                Contact
              </NavLink>
            </li>
            <li>
              <NavLink to={routePaths.careers} onClick={() => setOpen(false)}>
                Careers
              </NavLink>
            </li>
          </ul>
          <div className={styles.mobileAuth}>
            <button type="button" className={styles.mobileSearch} onClick={() => setSearchOpen(true)}>
              Search site
            </button>
            {authLoading ? null : signedIn ? (
              <>
                <a
                  href={accountHref}
                  onClick={() => {
                    setOpen(false)
                  }}
                >
                  {accountLabel}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    void signOut()
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to={authRoutes.signIn}
                onClick={() => {
                  setOpen(false)
                  trackEvent(analyticsEvents.signInClick)
                }}
              >
                Customer sign in
              </Link>
            )}
          </div>
          <Button
            to={startProjectHref({ source: 'navbar_mobile' })}
            fullWidth
            onClick={() => setOpen(false)}
            trackEvent={analyticsEvents.startProjectClick}
            trackParams={{ source: 'navbar_mobile' }}
          >
            Start a project
          </Button>
        </div>
      </div>

      <SiteSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
