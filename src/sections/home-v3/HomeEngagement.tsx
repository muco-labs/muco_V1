import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { pricingNote, pricingTiers } from '@/data/pricing'
import { routePaths } from '@/config/routes'
import { analyticsEvents } from '@/lib/analytics'
import styles from './HomeEngagement.module.css'

export function HomeEngagementSections() {
  return (
    <>
      <section className="section" id="pricing" aria-labelledby="pricing-title">
        <div className="shell">
          <Reveal>
            <p className="text-label">Engagement</p>
            <h2 id="pricing-title" className="text-h2">
              Pricing shaped around outcomes.
            </h2>
            <p className={styles.pricingNote}>{pricingNote}</p>
          </Reveal>
          <div className={styles.tiers}>
            {pricingTiers.map((tier, index) => (
              <Reveal key={tier.id} delayMs={index * 80}>
                <article
                  className={`surface ${styles.tier} ${tier.featured ? styles.tierFeatured : ''}`}
                >
                  <h3 className="text-h3">{tier.name}</h3>
                  <p className={styles.price}>{tier.priceLabel}</p>
                  <p className={styles.tierDesc}>{tier.description}</p>
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
          <p className={styles.pricingLink}>
            <Link className="link-underline" to={routePaths.pricing}>
              View engagement details
            </Link>
          </p>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="cta-title">
        <div className="shell">
          <Reveal className={`surface ${styles.cta}`}>
            <h2 id="cta-title" className="text-h1">
              Have an idea worth building?
            </h2>
            <p>Let&apos;s turn it into something real.</p>
            <div className={styles.ctaActions}>
              <Button
                to={routePaths.contact}
                size="lg"
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'home_cta' }}
              >
                Start a Project
              </Button>
              <Button
                to={routePaths.contact}
                variant="secondary"
                size="lg"
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'home_cta_secondary' }}
              >
                Talk to MUCO LABS
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
