import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { routePaths } from '@/config/routes'
import { analyticsEvents } from '@/lib/analytics'
import styles from './FinalCta.module.css'

type FinalCtaProps = {
  title?: string
  body?: string
  source: string
  service?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export function FinalCta({
  title = 'Have an idea?',
  body = "Let's build it—with clarity, craft and a team that ships.",
  source,
  service,
  secondaryLabel = 'Explore Services',
  secondaryHref = routePaths.services,
}: FinalCtaProps) {
  const primaryHref = startProjectHref({ source, service })
  return (
    <section className="section section--tight" aria-labelledby="final-cta-title">
      <div className="shell">
        <Reveal className={`surface ${styles.block}`}>
          <div className={styles.grid} aria-hidden="true" />
          <h2 id="final-cta-title" className="text-h1">
            {title}
          </h2>
          <p className={styles.body}>{body}</p>
          <div className={styles.actions}>
            <Button
              to={primaryHref}
              size="lg"
              trackEvent={analyticsEvents.startProjectClick}
              trackParams={{ source }}
            >
              Start a Project
            </Button>
            <Button to={secondaryHref} variant="secondary" size="lg">
              {secondaryLabel}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
