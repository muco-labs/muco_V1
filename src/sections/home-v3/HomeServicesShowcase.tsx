import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { ServiceCard } from '@/components/design-system/ServiceCard'
import { serviceHighlights } from '@/content/services-catalog'
import { routePaths } from '@/config/routes'
import styles from './HomeServicesShowcase.module.css'

const [featured, ...rest] = serviceHighlights

export function HomeServicesShowcase() {
  return (
    <section className="section" aria-labelledby="home-services-title">
      <div className="shell">
        <Reveal className={styles.head}>
          <div>
            <p className="text-label">Services</p>
            <h2 id="home-services-title" className="text-h2">
              Digital products that move businesses forward.
            </h2>
          </div>
          <Link className="link-underline" to={routePaths.services}>
            Full service catalog
          </Link>
        </Reveal>
        <div className={styles.grid}>
          <Reveal className={styles.featured}>
            <ServiceCard service={featured} variant="featured" />
          </Reveal>
          <div className={styles.secondary}>
            {rest.slice(0, 5).map((service, index) => (
              <Reveal key={service.slug} delayMs={index * 70}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
