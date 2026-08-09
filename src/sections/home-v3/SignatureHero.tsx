import { TechnicalBackdrop } from '@/components/opening/TechnicalBackdrop'
import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { HeroSignalPanel } from '@/components/home/HeroSignalPanel'
import { Reveal } from '@/components/motion/Reveal'
import { company } from '@/content/company'
import { site } from '@/config/site'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import styles from './SignatureHero.module.css'

export function SignatureHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <TechnicalBackdrop intensity="ambient" className={styles.backdrop} />
      <div className="shell">
        <div className={styles.grid}>
          <Reveal className={styles.copy}>
            <p className="eyebrow-line">{site.name} · Web, software & AI</p>
            <h1 id="home-hero-title" className="text-display">
              We build digital products that move businesses forward.
            </h1>
            <p className={styles.lead}>
              <strong>MUCO LABS</strong> is a founder-led technology company in Erode—websites,
              custom software, mobile apps, AI systems and growth programs for teams who need
              clarity, craft and accountable delivery. {company.positioning}
            </p>
            <div className={styles.actions}>
              <Button
                to={startProjectHref({ source: 'home_hero' })}
                size="lg"
                trackEvent={analyticsEvents.heroCtaClick}
                trackParams={{ source: 'home_hero', cta: 'start_project' }}
              >
                Start a project
              </Button>
              <Button
                to={routePaths.contact}
                variant="secondary"
                size="lg"
                trackEvent={analyticsEvents.contactClick}
                trackParams={{ source: 'home_hero', cta: 'contact' }}
              >
                Talk to us
              </Button>
              <Button
                to={routePaths.work}
                variant="ghost"
                size="lg"
                trackEvent={analyticsEvents.heroCtaClick}
                trackParams={{ source: 'home_hero', cta: 'view_work' }}
              >
                View work
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
