import { Link } from 'react-router-dom'
import { FounderPortrait } from '@/components/content/FounderPortrait'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { founder } from '@/content/founder'
import { routePaths } from '@/config/routes'
import { analyticsEvents } from '@/lib/analytics'
import styles from './HomeFounderSpotlight.module.css'

export function HomeFounderSpotlight() {
  return (
    <section className="section section--tight" aria-labelledby="home-founder-title">
      <div className="shell">
        <div className={`surface ${styles.card}`}>
          <Reveal className={styles.grid}>
            <FounderPortrait name={founder.name} imageSrc={founder.imageSrc} size="lg" />
            <div className={styles.copy}>
              <p className="text-label">Founder</p>
              <h2 id="home-founder-title" className="text-h2">
                {founder.name}
              </h2>
              <p className={styles.role}>{founder.title}</p>
              <p className={styles.intro}>{founder.introduction}</p>
              <p className={styles.philosophy}>{founder.philosophy}</p>
              <div className={styles.actions}>
                <Button
                  to={routePaths.contact}
                  trackEvent={analyticsEvents.startProjectClick}
                  trackParams={{ source: 'home_founder' }}
                >
                  Work with us
                </Button>
                <Link className="link-underline" to={`${routePaths.about}#founder`}>
                  Full founder profile
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
