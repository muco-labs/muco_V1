import { Reveal } from '@/components/motion/Reveal'
import { brandAssets } from '@/config/brand-assets'
import { trustPillars } from '@/data/testimonials'
import styles from './HomeCulture.module.css'

const principles = [
  'Build. Innovate. Solve—with accountable delivery.',
  'Design and engineering in one continuous thread.',
  'AI only where accountability and value are clear.',
  'Architectures that survive real users and real data.',
]

export function HomeCultureSections() {
  const cover = brandAssets.brandCover

  return (
    <>
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

      {cover.status === 'available' && cover.src ? (
        <section className="section section--tight" aria-label="MUCO LABS brand visual">
          <div className="shell">
            <Reveal>
              <figure className={styles.brandCover}>
                <img
                  src={cover.src}
                  alt="MUCO LABS — IT services and technology solutions from Erode"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </Reveal>
          </div>
        </section>
      ) : null}

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
