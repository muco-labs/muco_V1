import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MucoBrandLogo } from '@/components/brand/MucoBrandLogo'
import { authCopy } from '@/config/auth'
import { company } from '@/data/company'
import { routePaths } from '@/config/routes'
import styles from './CustomerAuthShell.module.css'

type CustomerAuthShellProps = {
  title: string
  lead?: string
  children: ReactNode
  footer?: ReactNode
}

export function CustomerAuthShell({ title, lead, children, footer }: CustomerAuthShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <aside className={styles.aside} aria-label="MUCO LABS">
          <Link to={routePaths.home} className={styles.brandLink}>
            <MucoBrandLogo size="lg" />
          </Link>
          <p className={styles.asideTagline}>{company.tagline}</p>
          <ul className={styles.values}>
            {company.values.map((value) => (
              <li key={value.title}>
                <strong>{value.title}</strong>
                <span>{value.body}</span>
              </li>
            ))}
          </ul>
          <p className={styles.asideFoot}>{company.footerBlurb}</p>
        </aside>

        <div className={styles.main}>
          <div className={styles.card}>
            <p className={styles.eyebrow}>{authCopy.brandLabel}</p>
            <h1 className={styles.title}>{title}</h1>
            {lead ? <p className={styles.lead}>{lead}</p> : null}
            {children}
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
