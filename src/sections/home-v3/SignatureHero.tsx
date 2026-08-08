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
              We build digital products that move businesses forward.
            </h1>
            <p className={styles.lead}>
              <strong>For founders and growing businesses</strong> who need websites, software, AI and
              growth systems with clear scope. {company.positioning}
            </p>
            <div className={styles.actions}>
              <Button
                to={routePaths.contact}
                size="lg"
                trackEvent={analyticsEvents.heroCtaClick}
                trackParams={{ source: 'home_hero', cta: 'start_project' }}
              >
                Start a Project
              </Button>
              <Button
                to={routePaths.work}
                variant="secondary"
                size="lg"
                trackEvent={analyticsEvents.heroCtaClick}
                trackParams={{ source: 'home_hero', cta: 'view_work' }}
              >
                View Our Work
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
