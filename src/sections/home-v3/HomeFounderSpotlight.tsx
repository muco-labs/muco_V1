import { Link } from 'react-router-dom'
import { FounderPortrait } from '@/components/content/FounderPortrait'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { founder } from '@/content/founder'
import { routePaths } from '@/config/routes'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import styles from './HomeFounderSpotlight.module.css'

export function HomeFounderSpotlight() {
  return (
    <section className="section section--tight" aria-labelledby="home-founder-title">
      <div className="shell">
        <div className={`surface ${styles.card}`}>
          <Reveal className={styles.grid}>
            <div className={styles.portrait}>
              <FounderPortrait
                name={founder.name}
                imageSrc={founder.imageSrc}
                size="editorial"
                objectPosition="center 15%"
                loading="eager"
                placeholderLabel="Founder photo"
              />
            </div>
            <div className={styles.copy}>
              <p className="text-label">Founder</p>
              <h2 id="home-founder-title" className="text-h2">
                {founder.name}
              </h2>
              <p className={styles.role}>{founder.title}</p>
              <p className={styles.lead}>{founder.introduction}</p>
              <div className={styles.actions}>
                <Button
                  to={startProjectHref({ source: 'home_founder' })}
                  trackEvent={analyticsEvents.startProjectClick}
                  trackParams={{ source: 'home_founder' }}
                >
                  Start a project
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
