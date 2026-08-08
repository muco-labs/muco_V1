import { Link, Navigate, useParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema, FaqPageSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { routePaths, servicePath } from '@/config/routes'
import {
  getIndustrySolutionSeo,
  industrySolutions,
  isIndustrySolutionSlug,
} from '@/content/solutions/industries'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { contactHref } from '@/lib/conversion/contact-link'
import { useEffect } from 'react'
import styles from '../ErodePage.module.css'

export function IndustrySolutionPage() {
  const { industrySlug = '' } = useParams()

  useEffect(() => {
    if (isIndustrySolutionSlug(industrySlug)) {
      trackEvent(analyticsEvents.solutionIndustryView, { industry: industrySlug })
    }
  }, [industrySlug])

  if (!isIndustrySolutionSlug(industrySlug)) {
    return <Navigate to={routePaths.solutions} replace />
  }

  const content = industrySolutions[industrySlug]
  const seo = getIndustrySolutionSeo(industrySlug)
  const pageSource = `solution_${industrySlug}`

  return (
    <>
      <PageMeta documentTitle={seo.documentTitle} description={seo.description} path={seo.path} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Solutions', path: routePaths.solutions },
          { name: content.h1, path: seo.path },
        ]}
      />
      <FaqPageSchema faqs={content.faqs} />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={routePaths.home}>Home</Link>
              <span aria-hidden="true">/</span>
              <Link to={routePaths.solutions}>Solutions</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{content.h1}</span>
            </nav>
            <Reveal>
              <h1 className="text-display">{content.h1}</h1>
              <p className={styles.lead}>{content.lead}</p>
            </Reveal>
          </div>
        </header>

        <section className="section section--tight">
          <div className="shell">
            <h2 className="text-h2">Problems we hear</h2>
            <ul className={styles.list}>
              {content.problems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2 className="text-h2">Our approach</h2>
            <p className={styles.body}>{content.approach}</p>
            <h2 className="text-h2">Technology</h2>
            <p className={styles.body}>{content.technologies.join(' · ')}</p>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <h2 className="text-h2">Related services</h2>
            <ul className={styles.serviceLinks}>
              {content.relatedServices.map((slug) => (
                <li key={slug}>
                  <Link className="link-underline" to={servicePath(slug)}>
                    {slug.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button
                to={contactHref({ source: pageSource })}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: pageSource }}
              >
                Request a consultation
              </Button>
              <Link className="link-underline" to={routePaths.work}>
                View work
              </Link>
              <Link className="link-underline" to={routePaths.india}>
                India delivery
              </Link>
            </div>
          </div>
        </section>

        {content.faqs.length ? (
          <section className="section section--tight">
            <div className="shell">
              <h2 className="text-h2">FAQ</h2>
              <dl className={styles.faq}>
                {content.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="text-h3">{faq.question}</dt>
                    <dd>{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}
