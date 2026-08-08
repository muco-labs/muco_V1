import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { Reveal } from '@/components/motion/Reveal'
import { serviceHighlights } from '@/content/services-catalog'
import { servicePath } from '@/config/routes'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
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
                Websites, software, mobile, AI, automation and growth—scoped clearly and delivered
                with founder-led oversight from Erode.
              </p>
            </Reveal>
          </div>
        </header>
        <section className="section">
          <div className="shell">
            <div className={styles.grid}>
              {serviceHighlights.map((service, index) => (
                <Reveal key={service.slug} delayMs={index * 60}>
                  <article className={`surface surface--lift ${styles.card}`}>
                    <p className={styles.category}>{service.category}</p>
                    <h2 className="text-h3">
                      <Link to={servicePath(service.slug)}>{service.title}</Link>
                    </h2>
                    {service.from ? (
                      <p className={styles.from}>From {service.from}</p>
                    ) : null}
                    <p>{service.summary}</p>
                    <p className={styles.problem}>
                      <strong>Problem:</strong> {service.problem}
                    </p>
                    <ul className={styles.delivers}>
                      {service.delivers.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <Link className="link-underline" to={servicePath(service.slug)}>
                      View service details
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className={styles.cta}>
              <Button to={routePaths.contact}>Start a project</Button>
              <Link className="link-underline" to={routePaths.pricing}>
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
