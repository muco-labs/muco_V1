import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { founder } from '@/data/founder'
import { trustPillars } from '@/data/testimonials'
import { routePaths } from '@/config/routes'
import styles from './HomeCulture.module.css'

const principles = [
  'Built for outcomes—not deliverable theatre.',
  'Design and engineering in one continuous thread.',
  'AI only where accountability and value are clear.',
  'Architectures that survive real users and real data.',
]

export function HomeCultureSections() {
  return (
    <>
      <section className={`section ${styles.signature}`} aria-labelledby="sig-title">
        <div className="shell">
          <div className={styles.signatureGrid}>
            <Reveal>
              <p className="text-label">Signature</p>
              <h2 id="sig-title" className="text-h1">
                Clarity at speed.
              </h2>
              <p className={styles.sigBody}>
                We compress the distance between strategy, design and production code—so your
                team ships with confidence.
              </p>
            </Reveal>
            <Reveal variant="slide-left" delayMs={100}>
              <div className={styles.meter} aria-hidden="true">
                <span style={{ '--w': '82%' } as CSSProperties} />
                <span style={{ '--w': '68%' } as CSSProperties} />
                <span style={{ '--w': '91%' } as CSSProperties} />
                <span style={{ '--w': '74%' } as CSSProperties} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="why-title">
        <div className="shell">
          <Reveal>
            <p className="text-label">Why MUCO LABS</p>
            <h2 id="why-title" className="text-h2">
              Principles we ship by.
            </h2>
          </Reveal>
          <ol className={styles.principles}>
            {principles.map((line, index) => (
              <Reveal as="li" key={line} delayMs={index * 60}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{line}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="founder-title">
        <div className="shell">
          <div className={styles.founderGrid}>
            <Reveal>
              <p className="text-label">Leadership</p>
              <h2 id="founder-title" className="text-h2">
                Founder
              </h2>
              <p className={styles.founderStatus}>
                {founder.status === 'pending_verification'
                  ? 'Profile pending verified publication'
                  : 'Leadership'}
              </p>
              <p className={styles.founderIntro}>{founder.introduction}</p>
              {founder.vision ? <p className={styles.founderVision}>{founder.vision}</p> : null}
              <Link className="link-underline" to={routePaths.about}>
                Read our story
              </Link>
            </Reveal>
            <Reveal variant="slide-left" delayMs={120}>
              <div className={styles.founderVisual} aria-hidden="true">
                <div className={styles.founderFrame}>
                  <span className={styles.initials}>ML</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="trust-title">
        <div className="shell">
          <Reveal>
            <p className="text-label">Trust architecture</p>
            <h2 id="trust-title" className="text-h2">
              Credibility without fabrication.
            </h2>
          </Reveal>
          <div className={styles.trustGrid}>
            {trustPillars.map((pillar, index) => (
              <Reveal key={pillar.title} delayMs={index * 70}>
                <article className={`surface ${styles.trustCard}`}>
                  <h3 className="text-h3">{pillar.title}</h3>
                  <p>{pillar.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
