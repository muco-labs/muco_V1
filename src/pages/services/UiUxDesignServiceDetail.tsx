import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import {
  BreadcrumbSchema,
  FaqPageSchema,
  ServiceSchema,
} from '@/components/seo/StructuredData'
import { DesignSystemShowcase } from '@/components/services/ui-ux/DesignSystemShowcase'
import { UiUxHeroVisual } from '@/components/services/ui-ux/UiUxHeroVisual'
import { ProjectPreview } from '@/components/visual/ProjectPreview'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { getServiceSeo } from '@/config/seo'
import { env } from '@/config/env'
import { routePaths, servicePath, type ServiceSlug } from '@/config/routes'
import {
  uiUxAudience,
  uiUxBuildItems,
  uiUxHero,
  uiUxOutcomeItems,
  uiUxProblem,
  uiUxProcessSteps,
  uiUxShowcaseProjects,
  uiUxWhy,
} from '@/content/ui-ux-service'
import { serviceFaqs, serviceRelatedSlugs } from '@/data/service-seo'
import { getServiceContent } from '@/data/service-content'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import styles from './UiUxDesignServiceDetail.module.css'

const SLUG: ServiceSlug = 'ui-ux-design'

export function UiUxDesignServiceDetail() {
  const content = getServiceContent(SLUG)
  const seo = getServiceSeo(SLUG)
  const url = `${env.siteUrl}/services/${SLUG}`
  const faqs = serviceFaqs[SLUG] ?? []
  const related = serviceRelatedSlugs[SLUG] ?? []

  useEffect(() => {
    trackEvent(analyticsEvents.serviceView, { service_slug: SLUG })
  }, [])

  if (!content) return null

  return (
    <>
      <PageMeta documentTitle={seo.documentTitle} description={seo.description} path={seo.path} />
      <ServiceSchema name={seo.h1} description={seo.description} url={url} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: seo.h1, path: seo.path },
        ]}
      />
      {faqs.length > 0 ? <FaqPageSchema faqs={faqs} /> : null}

      <article className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={routePaths.home}>Home</Link>
              <span aria-hidden="true">/</span>
              <Link to={routePaths.services}>Services</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{seo.h1}</span>
            </nav>
            <div className={styles.heroGrid}>
              <Reveal className={styles.heroCopy}>
                <p className="text-label">{uiUxHero.eyebrow}</p>
                <h1 className="text-display">{uiUxHero.headline}</h1>
                <p className={styles.heroLead}>{uiUxHero.lead}</p>
                <p className={styles.heroSupport}>{uiUxHero.supporting}</p>
                <div className={styles.heroActions}>
                  <Button
                    to={startProjectHref({ service: SLUG, source: 'ui_ux_service' })}
                    size="lg"
                    trackEvent={analyticsEvents.startProjectClick}
                    trackParams={{ source: 'service_ui_ux_hero', service_slug: SLUG }}
                  >
                    Start a Project
                  </Button>
                  <Link className="link-underline" to={routePaths.work}>
                    View concept work
                  </Link>
                </div>
              </Reveal>
              <Reveal delayMs={80} variant="fade" className={styles.heroVisual}>
                <UiUxHeroVisual />
                <p className={styles.visualNote}>MUCO LABS concept composition — not a client deliverable</p>
              </Reveal>
            </div>
          </div>
        </header>

        <section className={`section section--tight ${styles.editorial}`} aria-labelledby="ui-ux-audience">
          <div className="shell">
            <div className={styles.editorialGrid}>
              <Reveal>
                <article className={styles.editorialCard}>
                  <span className={styles.editorialMark} aria-hidden="true" />
                  <p className="text-label">{uiUxAudience.label}</p>
                  <h2 id="ui-ux-audience" className={styles.editorialStatement}>
                    {uiUxAudience.statement}
                  </h2>
                  <p className={styles.editorialBody}>{uiUxAudience.body}</p>
                </article>
              </Reveal>
              <Reveal delayMs={60}>
                <article className={styles.editorialCard}>
                  <span className={styles.editorialMark} aria-hidden="true" />
                  <p className="text-label">{uiUxProblem.label}</p>
                  <h2 className={styles.editorialStatement}>{uiUxProblem.statement}</h2>
                  <p className={styles.editorialBody}>{uiUxProblem.body}</p>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--tight" aria-labelledby="ui-ux-deliverables">
          <div className="shell">
            <Reveal>
              <p className="text-label">Deliverables</p>
              <h2 id="ui-ux-deliverables" className="text-h2">
                What we build — what you get
              </h2>
            </Reveal>
            <div className={styles.compareGrid}>
              <Reveal>
                <article className={`surface ${styles.compareCard}`}>
                  <h3 className="text-h3">What we build</h3>
                  <ul className={styles.checkList}>
                    {uiUxBuildItems.map((item) => (
                      <li key={item}>
                        <span className={styles.checkIcon} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
              <Reveal delayMs={80}>
                <article className={`surface ${styles.compareCard}`}>
                  <h3 className="text-h3">What you get</h3>
                  <ul className={styles.checkList}>
                    {uiUxOutcomeItems.map((item) => (
                      <li key={item}>
                        <span className={styles.checkIcon} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className={`section section--tight ${styles.systemSection}`} aria-labelledby="ui-ux-system">
          <div className="shell">
            <Reveal>
              <p className="text-label">Design system</p>
              <h2 id="ui-ux-system" className="text-h2">
                Components your product can grow on
              </h2>
              <p className={styles.sectionLead}>
                Typography, spacing, controls and patterns—documented for design and engineering alignment.
              </p>
            </Reveal>
            <Reveal delayMs={60}>
              <DesignSystemShowcase />
            </Reveal>
          </div>
        </section>

        <section className="section section--tight" aria-labelledby="ui-ux-showcase">
          <div className="shell">
            <Reveal>
              <p className="text-label">Concept work</p>
              <h2 id="ui-ux-showcase" className="text-h2">
                Product UI compositions
              </h2>
              <p className={styles.sectionLead}>
                Example interfaces that demonstrate how MUCO LABS approaches layout, density and interaction—not
                verified client case studies.
              </p>
            </Reveal>
            <div className={styles.showcaseGrid}>
              {uiUxShowcaseProjects.map((project, index) => (
                <Reveal key={project.title} delayMs={index * 50}>
                  <figure className={styles.showcaseItem}>
                    <ProjectPreview visual={project.visual} title={project.title} category={project.category} />
                    <figcaption className={styles.showcaseCaption}>
                      <span className={styles.showcaseLabel}>MUCO LABS CONCEPT WORK</span>
                      <span className={styles.showcaseTitle}>{project.title}</span>
                      <span className={styles.showcaseCategory}>{project.category}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`section section--tight ${styles.processSection}`} aria-labelledby="ui-ux-process">
          <div className="shell">
            <Reveal>
              <p className="text-label">Process</p>
              <h2 id="ui-ux-process" className="text-h2">
                How we work
              </h2>
            </Reveal>
            <ol className={styles.processTimeline}>
              {uiUxProcessSteps.map((step, index) => (
                <Reveal key={step.num} as="li" className={styles.processStep} delayMs={index * 40}>
                  <span className={styles.processNum}>{step.num}</span>
                  <div className={styles.processBody}>
                    <h3 className="text-h3">{step.title}</h3>
                    <p>{step.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className={`section section--tight ${styles.whySection}`} aria-labelledby="ui-ux-why">
          <div className="shell">
            <Reveal>
              <p className="text-label">Why it matters</p>
              <h2 id="ui-ux-why" className="text-h2">
                Why it matters
              </h2>
              <blockquote className={styles.whyQuote}>{uiUxWhy.quote}</blockquote>
            </Reveal>
            <div className={styles.principles}>
              {uiUxWhy.principles.map((principle, index) => (
                <Reveal key={principle.title} delayMs={index * 50}>
                  <article className={`surface ${styles.principleCard}`}>
                    <h3 className="text-h3">{principle.title}</h3>
                    <p>{principle.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <div className="shell section section--tight">
          {faqs.length > 0 ? (
            <Reveal className={styles.faq}>
              <h2 className="text-h2">Common questions</h2>
              <dl>
                {faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="text-h3">{faq.question}</dt>
                    <dd>{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ) : null}

          {related.length > 0 ? (
            <Reveal className={styles.related}>
              <h2 className="text-h3">Related services</h2>
              <ul>
                {related.map((relatedSlug) => (
                  <li key={relatedSlug}>
                    <Link className="link-underline" to={servicePath(relatedSlug)}>
                      {getServiceContent(relatedSlug)?.title ?? relatedSlug}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          <div className={styles.footerCta}>
            <Button
              to={startProjectHref({ service: SLUG, source: 'ui_ux_service' })}
              size="lg"
              trackEvent={analyticsEvents.startProjectClick}
              trackParams={{ source: 'service_ui_ux_footer', service_slug: SLUG }}
            >
              Start a Project
            </Button>
            <Link className="link-underline" to={routePaths.pricing}>
              View pricing guidance
            </Link>
            <Link className="link-underline" to={routePaths.services}>
              All services
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}
