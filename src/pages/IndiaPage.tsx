import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema, FaqPageSchema } from '@/components/seo/StructuredData'
import { MarketLandingHero } from '@/components/marketing/MarketLandingHero'
import { MarketGeoHeroVisual } from '@/components/marketing/MarketGeoHeroVisual'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { routePaths } from '@/config/routes'
import {
  indiaContactBlurb,
  indiaFaqs,
  indiaHub,
  indiaHubSeo,
  indiaRelatedLinks,
  indiaServiceLinks,
} from '@/content/market/india'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { useEffect } from 'react'
import styles from './ErodePage.module.css'

export function IndiaPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.indiaPageView, {})
  }, [])

  return (
    <>
      <PageMeta
        documentTitle={indiaHubSeo.documentTitle}
        description={indiaHubSeo.description}
        path={indiaHubSeo.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'India', path: indiaHub.path },
        ]}
      />
      <FaqPageSchema faqs={[...indiaFaqs]} />
      <div className={styles.page}>
        <MarketLandingHero
          breadcrumbs={[
            { label: 'Home', href: routePaths.home },
            { label: 'India' },
          ]}
          label="India-wide delivery"
          title={indiaHub.h1}
          lead={indiaHub.lead}
          visual={<MarketGeoHeroVisual sceneId="india-lattice" scene="lattice" />}
        />

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Who we serve</h2>
              <ul className={styles.list}>
                {indiaHub.coverage.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delayMs={60}>
              <h2 className="text-h2">Delivery model</h2>
              <ul className={styles.list}>
                {indiaHub.delivery.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
            <p className={styles.body}>{indiaHub.industries}</p>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <h2 className="text-h2">Services</h2>
            <ul className={styles.serviceLinks}>
              {indiaServiceLinks.map((item) => (
                <li key={item.slug}>
                  <Link className="link-underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className={styles.serviceLinks}>
              {indiaRelatedLinks.map((item) => (
                <li key={item.href}>
                  <Link className="link-underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button
                to={startProjectHref({ source: 'india_hub' })}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'india_hub' }}
              >
                Start a project
              </Button>
              <Link className="link-underline" to={routePaths.pricing}>
                Pricing
              </Link>
              <Link className="link-underline" to={routePaths.international}>
                International
              </Link>
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <h2 className="text-h2">Questions</h2>
            <dl className={styles.faq}>
              {indiaFaqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-h3">{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.contact}>{indiaContactBlurb}</p>
          </div>
        </section>
      </div>
    </>
  )
}
