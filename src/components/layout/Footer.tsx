import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { site } from '@/config/site'
import { routePaths } from '@/config/routes'
import { footerNav } from '@/data/navigation'
import styles from './Footer.module.css'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <Container size="2xl">
        <div className={styles.grid}>
          <div className={styles.brandBlock}>
            <Link to={routePaths.home} className={styles.brand}>
              {site.name}
            </Link>
            <p className={styles.tagline}>{site.tagline}</p>
            <a className={styles.email} href={`mailto:${site.contactEmail}`}>
              {site.contactEmail}
            </a>
          </div>

          <div>
            <h2 className={styles.columnTitle}>Company</h2>
            <ul className={styles.links}>
              {footerNav.company.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={styles.columnTitle}>Services</h2>
            <ul className={styles.links}>
              {footerNav.services.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={styles.columnTitle}>Legal</h2>
            <ul className={styles.links}>
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {year} {site.legalName}. All rights reserved.</p>
          <p className={styles.note}>Public website · Application portals planned separately.</p>
        </div>
      </Container>
    </footer>
  )
}
