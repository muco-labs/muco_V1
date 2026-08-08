import { Link, Navigate, useParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { ProjectPreview } from '@/components/visual/ProjectPreview'
import { Badge } from '@/components/ui/Badge'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { FinalCta } from '@/components/design-system/FinalCta'
import {
  getPortfolioProject,
  portfolioKindLabel,
  portfolioStatusLabel,
} from '@/data/portfolio'
import { routePaths, servicePath } from '@/config/routes'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import styles from './WorkProjectPage.module.css'

export function WorkProjectPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = slug ? getPortfolioProject(slug) : undefined

  useEffect(() => {
    if (!project) return
    trackEvent(analyticsEvents.portfolioView, { project_id: project.id })
  }, [project])

  if (!slug || !project) {
    return <Navigate to="/404" replace />
  }

  const description = `${portfolioKindLabel(project.kind)}: ${project.tagline}`

  return (
    <>
      <PageMeta
        documentTitle={`${project.title} | MUCO LABS Work`}
        description={description}
        path={`/work/${project.id}`}
      />
      <article className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={routePaths.home}>Home</Link>
              <span aria-hidden="true">/</span>
              <Link to={routePaths.work}>Work</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{project.title}</span>
            </nav>
            <Reveal>
              <div className={styles.badges}>
                <Badge>{portfolioKindLabel(project.kind)}</Badge>
                <span className={styles.status}>{portfolioStatusLabel(project.status)}</span>
              </div>
              <h1 className="text-display">{project.title}</h1>
              <p className={styles.lead}>{project.tagline}</p>
              <p className={styles.meta}>
                {project.category} · {project.role}
              </p>
            </Reveal>
          </div>
        </header>

        <div className="shell section section--tight">
          <div className={styles.grid}>
            <Reveal>
              <div className={styles.visual}>
                {project.screenshotSrc ? (
                  <img
                    src={project.screenshotSrc}
                    alt={`Screenshot of ${project.title}`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <>
                    <ProjectPreview visual={project.visual} title={project.title} />
                    <p className={styles.visualNote}>Project screenshot placeholder—replace when assets are ready.</p>
                  </>
                )}
              </div>
            </Reveal>
            <div className={styles.copy}>
              <Reveal>
                <h2 className="text-h2">Challenge</h2>
                <p>{project.problem}</p>
              </Reveal>
              <Reveal delayMs={60}>
                <h2 className="text-h2">Approach</h2>
                <p>{project.solution}</p>
              </Reveal>
              {project.outcome ? (
                <Reveal delayMs={120}>
                  <h2 className="text-h2">Outcome</h2>
                  <p>{project.outcome}</p>
                </Reveal>
              ) : null}
              {project.caseStudy ? (
                <Reveal delayMs={140}>
                  <h2 className="text-h2">Case study</h2>
                  <dl className={styles.caseStudy}>
                    <div>
                      <dt>Challenge</dt>
                      <dd>{project.caseStudy.challenge}</dd>
                    </div>
                    <div>
                      <dt>Approach</dt>
                      <dd>{project.caseStudy.approach}</dd>
                    </div>
                    <div>
                      <dt>Build</dt>
                      <dd>{project.caseStudy.build}</dd>
                    </div>
                    <div>
                      <dt>Result</dt>
                      <dd>{project.caseStudy.result}</dd>
                    </div>
                  </dl>
                </Reveal>
              ) : null}
            </div>
          </div>

          <div className={styles.columns}>
            <Reveal>
              <section className={`surface ${styles.panel}`}>
                <h2 className="text-h3">Features</h2>
                <ul>
                  {project.features.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </Reveal>
            <Reveal delayMs={80}>
              <section className={`surface ${styles.panel}`}>
                <h2 className="text-h3">Capabilities</h2>
                <ul>
                  {project.capabilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </Reveal>
            <Reveal delayMs={120}>
              <section className={`surface ${styles.panel}`}>
                <h2 className="text-h3">Technology</h2>
                <ul>
                  {project.technology.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </Reveal>
          </div>

          <div className={styles.actions}>
            {project.projectUrl ? (
              <a
                className="link-underline"
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit public URL
              </a>
            ) : null}
            {project.relatedServiceSlug ? (
              <Link className="link-underline" to={servicePath(project.relatedServiceSlug)}>
                Related service
              </Link>
            ) : null}
            <Button
              to={routePaths.contact}
              trackEvent={analyticsEvents.startProjectClick}
              trackParams={{ source: 'work_detail', project_id: project.id }}
            >
              Start a similar project
            </Button>
          </div>
        </div>

        <FinalCta
          source="work_detail"
          title="Ready to build?"
          body="Tell us what you need—we will scope an honest path forward."
        />
      </article>
    </>
  )
}
