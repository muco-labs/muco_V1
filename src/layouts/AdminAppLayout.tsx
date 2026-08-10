import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { adminNavSectionsForPermissions, adminPortalPaths } from '@/config/admin-portal'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/Button'
import styles from './EmployeeAppLayout.module.css'

export function AdminAppLayout() {
  const { profile, signOut } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const sections = adminNavSectionsForPermissions(profile?.permissions ?? [])

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
        documentTitle="Admin control center | MUCO LABS"
        description="MUCO LABS founder and admin operations."
        path={adminPortalPaths.root}
        noIndex
      />
      <div className={styles.shell}>
        <div className="aurora-bg" aria-hidden="true" />
        <a href="#admin-main" className={styles.skipLink}>
          Skip to main content
        </a>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <Link to={adminPortalPaths.root} className={styles.brand}>
              MUCO LABS <span>Admin</span>
            </Link>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={navOpen}
              aria-controls="admin-nav"
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
            id="admin-nav"
            className={`${styles.nav} ${navOpen ? styles.navOpen : ''}`}
            aria-label="Admin control center"
          >
            {sections.map((section) => (
              <div key={section.title}>
                <p className={styles.navGroupLabel}>{section.title}</p>
                <ul>
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.end}
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
              </div>
            ))}
            <Link className={styles.marketingLink} to="/">
              Back to mucolabs.com
            </Link>
          </nav>

          <main id="admin-main" className={styles.main} tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
