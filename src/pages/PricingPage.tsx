import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { FaqPageSchema } from '@/components/seo/StructuredData'
import { FaqAccordion } from '@/components/content/FaqAccordion'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import {
  maintenanceNote,
  pricingNote,
  pricingTiers,
  serviceStartingPrices,
} from '@/data/pricing'
import { faqs } from '@/content/faqs'
import { pageSeo } from '@/config/seo'
import { contactHref } from '@/lib/conversion/contact-link'
import { servicePath } from '@/config/routes'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from './PricingPage.module.css'

const pricing = pageSeo.pricing

export function PricingPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.pricingView)
  }, [])

  const pricingFaqs = faqs.filter((f) => f.category === 'pricing' || f.category === 'process')

  return (
    <>
      <PageMeta
        documentTitle={pricing.documentTitle}
        description={pricing.description}
        path={pricing.path}
      />
      <FaqPageSchema faqs={pricingFaqs.map((f) => ({ question: f.question, answer: f.answer }))} />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">Engagement</p>
              <h1 className="text-h1">Clear starting points. Honest proposals.</h1>
              <p className={styles.lead}>{pricingNote}</p>
            </Reveal>
          </div>
        </header>
        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Public starting prices</h2>
              <p className={styles.sectionLead}>
                Verified package entry points from mucolabs.com—final quotes depend on scope.
              </p>
            </Reveal>
            <div className={styles.priceTable}>
              {serviceStartingPrices.map((row, index) => (
                <Reveal key={row.id} delayMs={index * 50}>
                  <article className={`surface ${styles.priceRow}`}>
                    <div>
                      <p className={styles.rowCategory}>{row.category}</p>
                      <h3 className="text-h3">{row.title}</h3>
                      <p className={styles.rowSummary}>{row.summary}</p>
                    </div>
                    <div className={styles.rowPrice}>
                      <p className={styles.from}>From {row.from}</p>
                      {row.relatedSlug ? (
                        <Link className="link-underline" to={servicePath(row.relatedSlug)}>
                          Service details
                        </Link>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <p className={styles.maintenance}>{maintenanceNote}</p>
          </div>
        </section>
        <section className="section">
          <div className="shell">
            <div className={styles.grid}>
              {pricingTiers.map((tier, index) => (
                <Reveal key={tier.id} delayMs={index * 70}>
                  <article className={`surface ${tier.featured ? styles.featured : ''}`}>
                    <h2 className="text-h3">{tier.name}</h2>
                    <p className={styles.bestFor}>Best for: {tier.bestFor}</p>
                    <p className={styles.price}>{tier.priceLabel}</p>
                    <p>{tier.description}</p>
                    <ul>
                      {tier.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    {tier.limitations ? (
                      <p className={styles.limit}>{tier.limitations}</p>
                    ) : null}
                    <Button
                      to={contactHref({ source: `pricing_${tier.id}` })}
                      variant={tier.featured ? 'primary' : 'secondary'}
                      trackEvent={analyticsEvents.startProjectClick}
                      trackParams={{ source: 'pricing', tier: tier.id }}
                    >
                      {tier.cta}
                    </Button>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className={styles.footerCta}>
              <p className={styles.nextStep}>
                After you reach out, we confirm scope and send a written quote—no surprise fees.
              </p>
              <Button
                to={contactHref({ source: 'pricing' })}
                size="lg"
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'pricing' }}
              >
                Get a quote
              </Button>
            </div>
          </div>
        </section>
        <section className="section section--tight">
          <div className="shell">
            <FaqAccordion items={pricingFaqs} title="Pricing & process FAQ" />
          </div>
        </section>
      </div>
    </>
  )
}
