import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { HeroSignalPanel } from '@/components/home/HeroSignalPanel'
import { Reveal } from '@/components/motion/Reveal'
import { company } from '@/content/company'
import { site } from '@/config/site'
import { analyticsEvents } from '@/lib/analytics'
import styles from './SignatureHero.module.css'

export function SignatureHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className="shell">
        <div className={styles.grid}>
          <Reveal className={styles.copy}>
            <p className="eyebrow-line">{site.name} · Technology company</p>
            <h1 id="home-hero-title" className="text-display">
              Websites, software &amp; AI—
              <span className={styles.accent}> built to ship.</span>
            </h1>
            <p className={styles.lead}>
              {company.positioning} We help founders and teams in India and abroad launch products,
              platforms, and growth systems with clarity—not chaos.
            </p>
            <div className={styles.actions}>
              <Button
                to={routePaths.contact}
                size="lg"
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'home_hero' }}
              >
                Start a Project
              </Button>
              <Button to={routePaths.services} variant="secondary" size="lg">
                View Services
              </Button>
            </div>
          </Reveal>

          <Reveal className={styles.visual} variant="slide-left" delayMs={120}>
            <HeroSignalPanel />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
