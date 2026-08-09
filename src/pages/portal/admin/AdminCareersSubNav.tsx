import { Link } from 'react-router-dom'
import { adminPortalPaths } from '@/config/admin-portal'
import styles from '@/pages/portal/admin/AdminCareers.module.css'

export function CareersSubNav({ active }: { active: 'applications' | 'jobs' }) {
  return (
    <nav className={styles.subNav} aria-label="Careers sections">
      <Link
        className={active === 'applications' ? styles.subNavActive : 'link-underline'}
        to={adminPortalPaths.careers}
      >
        Applications
      </Link>
      <Link
        className={active === 'jobs' ? styles.subNavActive : 'link-underline'}
        to={adminPortalPaths.careersJobs}
      >
        Job openings
      </Link>
    </nav>
  )
}
