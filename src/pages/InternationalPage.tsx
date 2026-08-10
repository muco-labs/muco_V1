import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema, FaqPageSchema } from '@/components/seo/StructuredData'
import { MarketLandingHero } from '@/components/marketing/MarketLandingHero'
import { MarketGeoHeroVisual } from '@/components/marketing/MarketGeoHeroVisual'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { routePaths } from '@/config/routes'
import {
  internationalContactBlurb,
  internationalFaqs,
  internationalHub,
  internationalHubSeo,
  internationalRelatedLinks,
  internationalServiceLinks,
} from '@/content/market/international'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { useEffect } from 'react'
import styles from './ErodePage.module.css'

export function InternationalPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.internationalPageView, {})
  }, [])

  return (
    <>
      <PageMeta
        documentTitle={internationalHubSeo.documentTitle}
        description={internationalHubSeo.description}
        path={internationalHubSeo.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'International', path: internationalHub.path },
        ]}
      />
      <FaqPageSchema faqs={[...internationalFaqs]} />
      <div className={styles.page}>
        <MarketLandingHero
          breadcrumbs={[
            { label: 'Home', href: routePaths.home },
            { label: 'International' },
          ]}
          label="Global · Remote-first"
          title={internationalHub.h1}
          lead={internationalHub.lead}
          visual={<MarketGeoHeroVisual sceneId="international-core" scene="product-core" />}
        />

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Services</h2>
              <p className={styles.body}>{internationalHub.services}</p>
            </Reveal>
            <Reveal delayMs={60}>
              <h2 className="text-h2">How we collaborate</h2>
              <ul className={styles.list}>
                {internationalHub.delivery.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="text-h2">Trust & payments</h2>
              <ul className={styles.list}>
                {internationalHub.trust.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className={styles.body}>{internationalHub.privacy}</p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <h2 className="text-h2">Core capabilities</h2>
            <ul className={styles.serviceLinks}>
              {internationalServiceLinks.map((item) => (
                <li key={item.slug}>
                  <Link className="link-underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className={styles.serviceLinks}>
              {internationalRelatedLinks.map((item) => (
                <li key={item.href}>
                  <Link className="link-underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button
                to={startProjectHref({ source: 'international_hub' })}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'international_hub' }}
              >
                Discuss your project
              </Button>
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <h2 className="text-h2">Questions</h2>
            <dl className={styles.faq}>
              {internationalFaqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-h3">{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.contact}>{internationalContactBlurb}</p>
          </div>
        </section>
      </div>
    </>
  )
}
