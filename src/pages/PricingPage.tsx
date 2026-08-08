import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { pricingNote, pricingTiers } from '@/data/pricing'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from './PricingPage.module.css'

const pricing = pageSeo.pricing

export function PricingPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.pricingView)
  }, [])

  return (
    <>
      <PageMeta
        documentTitle={pricing.documentTitle}
        description={pricing.description}
        path={pricing.path}
      />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">Engagement</p>
              <h1 className="text-h1">Invest at the right altitude.</h1>
              <p className={styles.lead}>{pricingNote}</p>
            </Reveal>
          </div>
        </header>
        <section className="section">
          <div className="shell">
            <div className={styles.grid}>
              {pricingTiers.map((tier, index) => (
                <Reveal key={tier.id} delayMs={index * 70}>
                  <article className={`surface ${tier.featured ? styles.featured : ''}`}>
                    <h2 className="text-h3">{tier.name}</h2>
                    <p className={styles.price}>{tier.priceLabel}</p>
                    <p>{tier.description}</p>
                    <ul>
                      {tier.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <Link className="link-underline" to={routePaths.contact}>
                      {tier.cta}
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className={styles.footerCta}>
              <Button
                to={routePaths.contact}
                size="lg"
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'pricing' }}
              >
                Start a Project
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
