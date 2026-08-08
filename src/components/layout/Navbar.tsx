import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { HiBars3, HiXMark } from 'react-icons/hi2'
import { authRoutes } from '@/config/auth'
import { routePaths } from '@/config/routes'
import { site } from '@/config/site'
import { primaryNav } from '@/data/navigation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import styles from './Navbar.module.css'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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
    <header className={cn(styles.header, scrolled && styles.scrolled)}>
      <div className={`shell ${styles.bar}`}>
        <Link to={routePaths.home} className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <span>{site.name}</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(styles.link, isActive && styles.active)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <div className={styles.auth}>
            <Link to={authRoutes.signIn} className={styles.authLink}>
              Sign in
            </Link>
            <Link to={authRoutes.signUp} className={styles.authLink}>
              Sign up
            </Link>
          </div>
          <Button to={routePaths.contact} size="sm">
            Start a Project
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

      <div id="mobile-nav" className={cn(styles.mobile, open && styles.mobileOpen)} hidden={!open}>
        <div className="shell">
          <ul className={styles.mobileList}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <NavLink to={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className={styles.mobileAuth}>
            <Link to={authRoutes.signIn} onClick={() => setOpen(false)}>
              Customer sign in
            </Link>
            <Link to={authRoutes.signUp} onClick={() => setOpen(false)}>
              Customer sign up
            </Link>
          </div>
          <Button to={routePaths.contact} fullWidth onClick={() => setOpen(false)}>
            Start a Project
          </Button>
        </div>
      </div>
    </header>
  )
}
