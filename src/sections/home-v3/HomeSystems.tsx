import { useRef, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { DecorativeScene } from '@/components/three/DecorativeScene'
import { ScrollSceneSection } from '@/components/three/DecorativeScene'
import { ProjectCard } from '@/components/design-system/ProjectCard'
import { portfolioProjects } from '@/data/portfolio'
import { erodePositioning, erodeServiceLinks, erodeServiceHref } from '@/data/erode'
import { routePaths } from '@/config/routes'
import { deliveryProcess } from '@/content/process'
import styles from './HomeSystems.module.css'

const techGroups = [
  { title: 'Frontend', items: ['React', 'TypeScript', 'Vite', 'Design systems'] },
  { title: 'Backend', items: ['Node', 'PostgreSQL', 'REST APIs', 'Supabase'] },
  { title: 'Cloud & ops', items: ['Vercel', 'CI/CD', 'Observability', 'Security headers'] },
  { title: 'AI & data', items: ['Applied AI', 'Automation', 'Integrations', 'Analytics'] },
]

export function HomeHowWeWorkSection() {
  return (
    <section className="section section--tight" aria-labelledby="process-title">
      <div className="shell">
        <Reveal>
          <p className="text-label">How we work</p>
          <h2 id="process-title" className="text-h2">
            From idea to impact—in seven deliberate stages.
          </h2>
        </Reveal>
        <ol className={styles.process}>
          {deliveryProcess.map((item, index) => (
            <Reveal key={item.step} delayMs={index * 50}>
              <li className={styles.processStep}>
                <span className={styles.processIndex}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className={styles.processName}>{item.step}</p>
                  <p className={styles.processDetail}>{item.detail}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function HomeTechnologySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const [scrollProgress, setScrollProgress] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', setScrollProgress)

  return (
    <ScrollSceneSection scrollProgress={scrollProgress}>
      <section
        ref={sectionRef}
        className={`section section--tight ${styles.techSection}`}
        aria-labelledby="tech-title"
      >
        <div className={styles.techScene} aria-hidden="true">
          <DecorativeScene
            sceneId="home-tech-lattice"
            scene={() => import('@/components/three/scenes/TechnologyLatticeScene')}
            fallback={<div className={styles.techPoster} />}
          />
        </div>
        <div className="shell fk-scene__content">
        <Reveal className={styles.techHead}>
          <div>
            <p className="text-label">Technology & AI</p>
            <h2 id="tech-title" className="text-h2">
              Modern stack. Applied with restraint.
            </h2>
          </div>
        </Reveal>
        <div className={styles.techGrid}>
          {techGroups.map((group, index) => (
            <Reveal key={group.title} delayMs={index * 60}>
              <article className={`surface ${styles.techCard}`}>
                <h3 className="text-label">{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
        </div>
      </section>
    </ScrollSceneSection>
  )
}

export function HomeWorkPreviewSection() {
  return (
    <section className="section" aria-labelledby="work-title">
      <div className="shell">
        <Reveal className={styles.workHead}>
          <div>
            <p className="text-label">Work</p>
            <h2 id="work-title" className="text-h2">
              Internal builds and concept explorations—clearly labeled.
            </h2>
          </div>
          <Link className="link-underline" to={routePaths.work}>
            View portfolio
          </Link>
        </Reveal>
        <div className={styles.workGrid}>
          {portfolioProjects.slice(0, 3).map((project, index) => (
            <Reveal key={project.id} delayMs={index * 90}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomeLocalErodeSection() {
  return (
    <section className="section section--tight" aria-labelledby="erode-title">
      <div className="shell">
        <Reveal className={`surface ${styles.erode}`}>
          <p className="text-label">Erode · Tamil Nadu</p>
          <h2 id="erode-title" className="text-h2">
            {erodePositioning.headline}
          </h2>
          <p>{erodePositioning.body}</p>
          <ul className={styles.erodeList}>
            {erodeServiceLinks.map((item) => (
              <li key={item.slug}>
                <Link to={erodeServiceHref(item.slug)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

/** @deprecated Use section exports for homepage ordering */
export function HomeSystemsSections() {
  return (
    <>
      <HomeTechnologySection />
      <HomeWorkPreviewSection />
      <HomeHowWeWorkSection />
      <HomeLocalErodeSection />
    </>
  )
}
