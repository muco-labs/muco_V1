import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import {
  BreadcrumbSchema,
  FaqPageSchema,
  LocalBusinessSchema,
} from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { MarketLandingHero } from '@/components/marketing/MarketLandingHero'
import { Button } from '@/components/ui/Button'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { erodeLocalFaqs, erodeLocalPage, erodeServiceLinks } from '@/content/erode-local'
import { company } from '@/content/company'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
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
        <MarketLandingHero
          breadcrumbs={[
            { label: 'Home', href: routePaths.home },
            { label: 'Erode' },
          ]}
          label="Erode, Tamil Nadu"
          title={erodeLocalPage.h1}
          lead={erodeLocalPage.lead}
        />

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
                  <Link className="link-underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button
                to={startProjectHref({ source: 'erode_local' })}
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
              <Link className="link-underline" to={routePaths.tamilNadu}>
                Tamil Nadu
              </Link>
              <Link className="link-underline" to={routePaths.india}>
                India
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
