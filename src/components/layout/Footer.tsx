import { Link } from 'react-router-dom'
import { company } from '@/data/company'
import { footerNav } from '@/data/navigation'
import { routePaths } from '@/config/routes'
import { site } from '@/config/site'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from './Footer.module.css'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className="shell">
        <div className={styles.grid}>
          <div>
            <Link to={routePaths.home} className={styles.brand}>
              {site.name}
            </Link>
            <p className={styles.desc}>{company.tagline}</p>
            <a
              href={`mailto:${site.contactEmail}`}
              className={styles.email}
              onClick={() => trackEvent(analyticsEvents.emailClick, { location: 'footer' })}
            >
              {site.contactEmail}
            </a>
          </div>
          <div>
            <p className={styles.title}>Explore</p>
            <ul>
              {footerNav.explore.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link to={routePaths.pricing}>Pricing</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className={styles.title}>Legal</p>
            <ul>
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.copy}>
          © {year} {site.legalName}. {company.location.city}, {company.location.region},{' '}
          {company.location.country}.
        </p>
      </div>
    </footer>
  )
}
