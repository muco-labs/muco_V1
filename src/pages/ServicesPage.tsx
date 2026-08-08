import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { Reveal } from '@/components/motion/Reveal'
import { serviceCategories, resolveOfferingHref } from '@/data/services'
import { pageSeo } from '@/config/seo'
import styles from './ServicesPage.module.css'

const services = pageSeo.services

export function ServicesPage() {
  return (
    <>
      <PageMeta
        documentTitle={services.documentTitle}
        description={services.description}
        path={services.path}
      />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">Services</p>
              <h1 className="text-display">A complete technology ecosystem.</h1>
              <p className={styles.lead}>
                Organized by how teams buy and scale work—without overwhelming you with a wall of links.
              </p>
            </Reveal>
          </div>
        </header>
        <section className="section">
          <div className="shell">
            {serviceCategories.map((category) => (
              <Reveal key={category.id} className={styles.category}>
                <h2 className="text-h2">{category.title}</h2>
                <ul>
                  {category.offerings.map((offering) => {
                    const href = resolveOfferingHref(offering)
                    return (
                      <li key={offering.id}>
                        {href ? (
                          <Link to={href} className={styles.link}>
                            <span>{offering.title}</span>
                            <span aria-hidden="true">↗</span>
                          </Link>
                        ) : (
                          <span className={styles.soon}>{offering.title}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
