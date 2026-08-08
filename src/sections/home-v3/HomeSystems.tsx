import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { ProjectPreview } from '@/components/visual/ProjectPreview'
import { portfolioProjects } from '@/data/portfolio'
import { erodePositioning, erodeServices } from '@/data/erode'
import { routePaths } from '@/config/routes'
import styles from './HomeSystems.module.css'

const process = [
  'Discover',
  'Strategize',
  'Design',
  'Build',
  'Launch',
  'Grow',
]

const tech = ['Web', 'Mobile', 'Cloud', 'AI', 'Automation', 'Data', 'Security', 'APIs']

export function HomeSystemsSections() {
  return (
    <>
      <section className="section" aria-labelledby="work-title">
        <div className="shell">
          <Reveal className={styles.workHead}>
            <div>
              <p className="text-label">MUCO LABS concept work</p>
              <h2 id="work-title" className="text-h2">
                Demonstrations—not client claims.
              </h2>
            </div>
            <Link className="link-underline" to={routePaths.work}>
              View concept portfolio
            </Link>
          </Reveal>
          <div className={styles.workGrid}>
            {portfolioProjects.slice(0, 3).map((project, index) => (
              <Reveal key={project.id} delayMs={index * 90}>
                <article className={`surface surface--lift ${styles.workCard}`}>
                  <ProjectPreview visual={project.visual} title={project.title} />
                  <div className={styles.workBody}>
                    <p className={styles.workLabel}>{project.label}</p>
                    <h3 className="text-h3">{project.title}</h3>
                    <p>{project.problem}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="process-title">
        <div className="shell">
          <Reveal>
            <p className="text-label">Process</p>
            <h2 id="process-title" className="text-h2">
              From idea to impact.
            </h2>
          </Reveal>
          <div className={styles.process}>
            {process.map((step, index) => (
              <Reveal key={step} delayMs={index * 50}>
                <div className={styles.processStep}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{step}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="tech-title">
        <div className="shell">
          <Reveal className={styles.techHead}>
            <div>
              <p className="text-label">Technology + AI</p>
              <h2 id="tech-title" className="text-h2">
                Modern stack. Applied with restraint.
              </h2>
            </div>
            <ul className={styles.techList} aria-label="Technology domains">
              {tech.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="erode-title">
        <div className="shell">
          <Reveal className={`surface ${styles.erode}`}>
            <p className="text-label">Erode · Tamil Nadu</p>
            <h2 id="erode-title" className="text-h2">
              {erodePositioning.headline}
            </h2>
            <p>{erodePositioning.body}</p>
            <ul className={styles.erodeList}>
              {erodeServices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  )
}
