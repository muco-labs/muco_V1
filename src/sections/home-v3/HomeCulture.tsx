import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { FounderPortrait } from '@/components/content/FounderPortrait'
import { founder } from '@/content/founder'
import { company } from '@/content/company'
import { trustPillars } from '@/data/testimonials'
import { routePaths } from '@/config/routes'
import styles from './HomeCulture.module.css'

const principles = [
  'Built for outcomes—not deliverable theatre.',
  'Design and engineering in one continuous thread.',
  'AI only where accountability and value are clear.',
  'Architectures that survive real users and real data.',
]

const deliveryFocus = [
  { label: 'Engineering discipline', value: 92 },
  { label: 'Design clarity', value: 88 },
  { label: 'Delivery transparency', value: 95 },
  { label: 'Post-launch support', value: 86 },
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
                team ships with confidence. Based in {company.location.city}, serving clients
                across India and abroad.
              </p>
            </Reveal>
            <Reveal variant="slide-left" delayMs={100}>
              <div className={styles.meter} aria-label="Delivery focus areas">
                {deliveryFocus.map((item) => (
                  <div key={item.label} className={styles.meterRow}>
                    <div className={styles.meterLabel}>
                      <span>{item.label}</span>
                      <span className={styles.meterValue}>{item.value}%</span>
                    </div>
                    <div className={styles.meterTrack}>
                      <span style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
                <p className={styles.meterNote}>Illustrative focus weighting—not client metrics.</p>
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
                {founder.name}
              </h2>
              <p className={styles.founderRole}>{founder.title}</p>
              <p className={styles.founderIntro}>{founder.introduction}</p>
              <p className={styles.founderVision}>{founder.philosophy}</p>
              <ul className={styles.interests}>
                {founder.interests.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="link-underline" to={`${routePaths.about}#founder`}>
                Read our story
              </Link>
            </Reveal>
            <Reveal variant="slide-left" delayMs={120}>
              <FounderPortrait name={founder.name} imageSrc={founder.imageSrc} />
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
