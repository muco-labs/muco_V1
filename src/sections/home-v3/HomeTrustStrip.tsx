import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { serviceHighlights } from '@/content/services-catalog'
import { servicePath, routePaths } from '@/config/routes'
import styles from './HomeTrustStrip.module.css'

export function HomeTrustStrip() {
  return (
    <section className={styles.strip} aria-label="What MUCO LABS builds">
      <div className="shell">
        <Reveal>
          <p className={styles.label}>Build · Design · Automate · Grow</p>
        </Reveal>
        <ul className={styles.chips}>
          {serviceHighlights.map((service, index) => (
            <Reveal key={service.slug} delayMs={index * 40}>
              <li>
                <Link className={styles.chip} to={servicePath(service.slug)}>
                  {service.title.replace(' & ', ' · ')}
                </Link>
              </li>
            </Reveal>
          ))}
          <li>
            <Link className={`${styles.chip} ${styles.chipMuted}`} to={routePaths.services}>
              All services
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
