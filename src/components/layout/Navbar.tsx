import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { HiBars3, HiXMark } from 'react-icons/hi2'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { site } from '@/config/site'
import { routePaths } from '@/config/routes'
import { primaryNav } from '@/data/navigation'
import { cn } from '@/utils/cn'
import styles from './Navbar.module.css'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
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
    <header className={cn(styles.header, scrolled && styles.headerScrolled)}>
      <Container className={styles.inner} size="2xl">
        <Link to={routePaths.home} className={styles.brand} aria-label={`${site.name} home`}>
          <span className={styles.brandMark} aria-hidden="true" />
          <span>{site.name}</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.navList}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(styles.navLink, isActive && styles.navLinkActive)
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <Button to={routePaths.contact} size="sm" className={styles.desktopCta}>
            Start a Project
          </Button>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            {open ? <HiXMark aria-hidden="true" /> : <HiBars3 aria-hidden="true" />}
          </button>
        </div>
      </Container>

      <div
        id="mobile-navigation"
        className={cn(styles.mobilePanel, open && styles.mobilePanelOpen)}
        hidden={!open}
      >
        <Container size="2xl">
          <nav aria-label="Mobile primary">
            <ul className={styles.mobileList}>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(styles.mobileLink, isActive && styles.navLinkActive)
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <Button
            to={routePaths.contact}
            fullWidth
            className={styles.mobileCta}
            onClick={() => setOpen(false)}
          >
            Start a Project
          </Button>
        </Container>
      </div>
    </header>
  )
}
