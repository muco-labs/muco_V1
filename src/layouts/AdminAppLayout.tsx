import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { adminNavForPermissions, adminPortalPaths } from '@/config/admin-portal'
import { authRoutes } from '@/config/auth'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/Button'
import styles from './EmployeeAppLayout.module.css'

export function AdminAppLayout() {
  const { profile, signOut } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const navItems = adminNavForPermissions(profile?.permissions ?? [])

  return (
    <>
      <PageMeta
        documentTitle="Admin control center | MUCO LABS"
        description="MUCO LABS founder and admin operations."
        path={adminPortalPaths.root}
        noIndex
      />
      <div className={styles.shell}>
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
              onClick={() => setNavOpen((open) => !open)}
            >
              Menu
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
          <nav
            id="admin-nav"
            className={`${styles.nav} ${navOpen ? styles.navOpen : ''}`}
            aria-label="Admin control center"
          >
            <ul>
              {navItems.map((item) => (
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
            <Link className={styles.marketingLink} to={authRoutes.adminSignIn}>
              Admin sign-in
            </Link>
          </nav>

          <main className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
