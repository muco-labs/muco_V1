import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { freelancerNav, freelancerPortalPaths } from '@/config/freelancer-portal'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/Button'
import styles from './EmployeeAppLayout.module.css'

export function FreelancerAppLayout() {
  const { profile, signOut } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <>
      <PageMeta
        documentTitle="Freelancer workspace | MUCO LABS"
        description="MUCO LABS freelancer network workspace."
        path={freelancerPortalPaths.root}
        noIndex
      />
      <div className={styles.shell}>
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
            id="freelancer-nav"
            className={`${styles.nav} ${navOpen ? styles.navOpen : ''}`}
            aria-label="Freelancer workspace"
          >
            <ul>
              {freelancerNav.map((item) => (
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
          </nav>
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
