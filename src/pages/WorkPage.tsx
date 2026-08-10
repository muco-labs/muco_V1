import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { PageMeta } from '@/components/seo/PageMeta'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/design-system/PageHero'
import { ProjectCard } from '@/components/design-system/ProjectCard'
import { FinalCta } from '@/components/design-system/FinalCta'
import { DecorativeScene } from '@/components/three/DecorativeScene'
import { portfolioProjects } from '@/data/portfolio'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { startProjectHref } from '@/lib/conversion/start-project-link'
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
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Work', path: work.path },
        ]}
      />
      <div className={styles.page}>
        <PageHero
          eyebrow="Portfolio"
          title="Internal builds, concepts & demos"
          lead="Every item is labeled by type. Internal MUCO LABS work and concept explorations are never presented as unverified client case studies."
          visual={
            <DecorativeScene
              sceneId="work-constellation"
              scene={() => import('@/components/three/scenes/ServiceConstellationScene')}
              fallback={null}
            />
          }
        />
        <section className="section">
          <div className="shell">
            <div className={styles.grid}>
              {portfolioProjects.map((project, index) => (
                <Reveal key={project.id} delayMs={index * 80}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
            <div className={styles.cta}>
              <Button
                to={startProjectHref({ source: 'work' })}
              >
                Discuss your project
              </Button>
              <Link className="link-underline" to={routePaths.services}>
                Explore services
              </Link>
            </div>
          </div>
        </section>
        <FinalCta source="work" title="Want something similar?" body="Share your problem—we will scope an honest path to build." secondaryLabel="View Our Work" secondaryHref={routePaths.work} />
      </div>
    </>
  )
}
