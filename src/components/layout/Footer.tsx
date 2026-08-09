import { Link } from 'react-router-dom'
import { company } from '@/data/company'
import { footerNav } from '@/data/navigation'
import { serviceHighlights } from '@/content/services-catalog'
import { servicePath, routePaths } from '@/config/routes'
import { site } from '@/config/site'
import { brandAssets } from '@/config/brand-assets'
import { socialLinkList } from '@/content/social'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import styles from './Footer.module.css'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className="shell">
        <div className={styles.grid}>
          <div>
            <Link to={routePaths.home} className={styles.brand}>
              {brandAssets.logo.status === 'available' && brandAssets.logo.src ? (
                <span className={styles.brandLogoSlot}>
                  <img
                    src={brandAssets.logo.src}
                    alt=""
                    className={styles.brandLogo}
                    width={512}
                    height={512}
                    decoding="async"
                  />
                </span>
              ) : null}
              <span>{site.name}</span>
            </Link>
            <p className={styles.desc}>{company.footerBlurb}</p>
            <Link to={startProjectHref({ source: 'footer' })} className={styles.footerCta}>
              Start a project
            </Link>
            <a
              href={`mailto:${site.contactEmail}`}
              className={styles.email}
              onClick={() => trackEvent(analyticsEvents.emailClick, { location: 'footer' })}
            >
              {site.contactEmail}
            </a>
            <a href={`tel:${site.contactPhone}`} className={styles.phone}>
              {site.contactPhoneDisplay}
            </a>
            <ul className={styles.social}>
              {socialLinkList.map((item) => (
                <li key={item.id}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.title}>Explore</p>
            <ul>
              {footerNav.explore.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.title}>Services</p>
            <ul>
              {serviceHighlights.map((item) => (
                <li key={item.slug}>
                  <Link to={servicePath(item.slug)}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.title}>Customer</p>
            <ul>
              {footerNav.customer.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
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
