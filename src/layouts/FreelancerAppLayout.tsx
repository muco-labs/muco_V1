import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { freelancerNavMore, freelancerNavPrimary, freelancerPortalPaths } from '@/config/freelancer-portal'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/Button'
import styles from './EmployeeAppLayout.module.css'

export function FreelancerAppLayout() {
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
        documentTitle="Freelancer workspace | MUCO LABS"
        description="MUCO LABS freelancer network workspace."
        path={freelancerPortalPaths.root}
        noIndex
      />
      <div className={styles.shell}>
        <div className="aurora-bg" aria-hidden="true" />
        <a href="#freelancer-main" className={styles.skipLink}>
          Skip to main content
        </a>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <Link to={freelancerPortalPaths.root} className={styles.brand}>
              MUCO LABS <span>Freelancer</span>
            </Link>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={navOpen}
              aria-controls="freelancer-nav"
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
            id="freelancer-nav"
            className={`${styles.nav} ${navOpen ? styles.navOpen : ''}`}
            aria-label="Freelancer workspace"
          >
            <ul>
              {freelancerNavPrimary.map((item) => (
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
              {freelancerNavMore.map((item) => (
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
          <main id="freelancer-main" className={styles.main} tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
