import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion/Reveal'
import { company } from '@/content/company'
import { analyticsEvents } from '@/lib/analytics'
import styles from './SignatureHero.module.css'

export function SignatureHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className="shell">
        <div className={styles.grid}>
          <Reveal className={styles.copy}>
            <p className="eyebrow-line">MUCO LABS · Technology company</p>
            <h1 id="home-hero-title" className="text-display">
              Build what&apos;s next—
              <span className={styles.accent}> with intent.</span>
            </h1>
            <p className={styles.lead}>{company.tagline}</p>
            <div className={styles.actions}>
              <Button
                to={routePaths.contact}
                size="lg"
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'home_hero' }}
              >
                Start a Project
              </Button>
              <Button to={routePaths.services} variant="ghost" size="lg">
                Explore Services
              </Button>
            </div>
          </Reveal>

          <Reveal className={styles.visual} variant="slide-left" delayMs={120}>
            <div className={styles.visualInner} aria-hidden="true">
              <div className={styles.beam} />
              <div className={styles.panel}>
                <span className={styles.panelLabel}>Systems</span>
                <ul>
                  <li>Product</li>
                  <li>Platform</li>
                  <li>Automation</li>
                  <li>Growth</li>
                </ul>
              </div>
              <div className={styles.orbit} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
