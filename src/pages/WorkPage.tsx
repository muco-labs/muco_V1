import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { ProjectPreview } from '@/components/visual/ProjectPreview'
import { Reveal } from '@/components/motion/Reveal'
import { portfolioProjects, portfolioKindLabel } from '@/data/portfolio'
import { Badge } from '@/components/ui/Badge'
import { pageSeo } from '@/config/seo'
import { routePaths, servicePath } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from './WorkPage.module.css'

const work = pageSeo.work

export function WorkPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.portfolioView)
  }, [])

  return (
    <>
      <PageMeta
        documentTitle={work.documentTitle}
        description={work.description}
        path={work.path}
      />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">Portfolio</p>
              <h1 className="text-h1">Selected work &amp; concepts</h1>
              <p className={styles.lead}>
                Every item is labeled by type. Concept and demo work is never presented as a verified
                client case study.
              </p>
            </Reveal>
          </div>
        </section>
        <section className="section">
          <div className="shell">
            <div className={styles.grid}>
              {portfolioProjects.map((project, index) => (
                <Reveal key={project.id} delayMs={index * 80}>
                  <article className={`surface surface--lift ${styles.card}`}>
                    <ProjectPreview
                      visual={project.visual}
                      title={project.title}
                      category={project.category}
                    />
                    <div className={styles.body}>
                      <Badge>{portfolioKindLabel(project.kind)}</Badge>
                      <h2 className="text-h3">{project.title}</h2>
                      <p className={styles.category}>{project.category}</p>
                      <p className={styles.tagline}>{project.tagline}</p>
                      <p>
                        <strong>Problem:</strong> {project.problem}
                      </p>
                      <p>
                        <strong>Concept:</strong> {project.solution}
                      </p>
                      <ul className={styles.capabilities}>
                        {project.capabilities.map((cap) => (
                          <li key={cap}>{cap}</li>
                        ))}
                      </ul>
                      <p className={styles.tech}>{project.technology.join(' · ')}</p>
                      {project.relatedServiceSlug ? (
                        <p>
                          <Link
                            className="link-underline"
                            to={servicePath(project.relatedServiceSlug)}
                          >
                            Related service
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className={styles.cta}>
              <Button
                to={routePaths.contact}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'work' }}
              >
                Discuss your project
              </Button>
              <Link className="link-underline" to={routePaths.services}>
                Explore services
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
