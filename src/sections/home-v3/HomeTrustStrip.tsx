import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { routePaths } from '@/config/routes'
import styles from './HomeTrustStrip.module.css'

const pillars = [
  {
    title: 'Founder-led delivery',
    body: 'Direct accountability from discovery through launch—no hand-offs into a black box.',
  },
  {
    title: 'Engineering-first',
    body: 'Maintainable code, clear architecture, and security considered from day one.',
  },
  {
    title: 'Transparent process',
    body: 'Structured proposals, milestones, and communication—built into our client portals.',
  },
]

export function HomeTrustStrip() {
  return (
    <section className={styles.strip} aria-label="Why teams choose MUCO LABS">
      <div className="shell">
        <div className={styles.grid}>
          {pillars.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 60}>
              <article className={styles.item}>
                <h2 className="text-h3">{item.title}</h2>
                <p>{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className={styles.foot}>
          <p>
            Need a partner for websites, software, AI, or growth systems?{' '}
            <Link className="link-underline" to={routePaths.work}>
              View concept work
            </Link>{' '}
            or{' '}
            <Link className="link-underline" to={routePaths.contact}>
              start a project
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  )
}
