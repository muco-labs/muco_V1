import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import {
  BreadcrumbSchema,
  FaqPageSchema,
  LocalBusinessSchema,
} from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { pageSeo } from '@/config/seo'
import { routePaths, servicePath } from '@/config/routes'
import { erodeLocalFaqs, erodeLocalPage, erodeServiceLinks } from '@/content/erode-local'
import { company } from '@/content/company'
import { analyticsEvents } from '@/lib/analytics'
import { contactHref } from '@/lib/conversion/contact-link'
import styles from './ErodePage.module.css'

const erode = pageSeo.erode

export function ErodePage() {
  return (
    <>
      <PageMeta
        documentTitle={erode.documentTitle}
        description={erode.description}
        path={erode.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Erode', path: erode.path },
        ]}
      />
      <FaqPageSchema faqs={[...erodeLocalFaqs]} />
      <LocalBusinessSchema />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={routePaths.home}>Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Erode</span>
            </nav>
            <Reveal>
              <p className="text-label">Erode, Tamil Nadu</p>
              <h1 className="text-display">{erodeLocalPage.h1}</h1>
              <p className={styles.lead}>{erodeLocalPage.lead}</p>
            </Reveal>
          </div>
        </header>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Local presence, wider delivery</h2>
              <ul className={styles.list}>
                {erodeLocalPage.coverage.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="text-h2">Who we work with</h2>
              <p className={styles.body}>{erodeLocalPage.industries}</p>
            </Reveal>
            <p className={styles.address}>
              {company.location.city}, {company.location.region} {company.location.postalCode},{' '}
              {company.location.country}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Services for Erode businesses</h2>
              <p className={styles.body}>
                Explore capability pages—each describes problems, deliverables and how we work.
              </p>
            </Reveal>
            <ul className={styles.serviceLinks}>
              {erodeServiceLinks.map((item) => (
                <li key={item.slug}>
                  <Link className="link-underline" to={servicePath(item.slug)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button
                to={contactHref({ source: 'erode_local' })}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'erode_local' }}
              >
                Start a project
              </Button>
              <Link className="link-underline" to={routePaths.work}>
                View work
              </Link>
              <Link className="link-underline" to={routePaths.pricing}>
                Pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <h2 className="text-h2">Common questions</h2>
            <dl className={styles.faq}>
              {erodeLocalFaqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-h3">{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.contact}>{erodeLocalPage.contactBlurb}</p>
          </div>
        </section>
      </div>
    </>
  )
}
