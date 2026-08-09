import { Link, Navigate, useParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema, FaqPageSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { routePaths, servicePath } from '@/config/routes'
import {
  erodeLocalServices,
  getErodeLocalServiceSeo,
  isErodeLocalServiceSlug,
} from '@/content/erode/local-services'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import styles from '../ErodePage.module.css'

export function ErodeLocalServicePage() {
  const { serviceSlug = '' } = useParams()

  useEffect(() => {
    if (isErodeLocalServiceSlug(serviceSlug)) {
      trackEvent(analyticsEvents.erodeServiceView, { service: serviceSlug })
    }
  }, [serviceSlug])

  if (!isErodeLocalServiceSlug(serviceSlug)) {
    return <Navigate to={routePaths.erode} replace />
  }

  const content = erodeLocalServices[serviceSlug]
  const seo = getErodeLocalServiceSeo(serviceSlug)
  const pageSource = `erode_${serviceSlug.replace(/-/g, '_')}`

  return (
    <>
      <PageMeta documentTitle={seo.documentTitle} description={seo.description} path={seo.path} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Erode', path: routePaths.erode },
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
              <Link to={routePaths.erode}>Erode</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{content.h1}</span>
            </nav>
            <Reveal>
              <h1 className="text-display">{content.h1}</h1>
              <p className={styles.lead}>{content.lead}</p>
            </Reveal>
          </div>
        </header>

        {content.sections.map((section, index) => (
          <section key={section.title} className="section section--tight">
            <div className="shell">
              <Reveal delayMs={index * 40}>
                <h2 className="text-h2">{section.title}</h2>
                <p className={styles.body}>{section.body}</p>
              </Reveal>
            </div>
          </section>
        ))}

        <section className="section">
          <div className="shell">
            <h2 className="text-h2">National capability page</h2>
            <p className={styles.body}>
              For full deliverables, process and FAQs, see our{' '}
              <Link className="link-underline" to={servicePath(content.nationalServiceSlug)}>
                {content.nationalServiceSlug.replace(/-/g, ' ')} overview
              </Link>
              .
            </p>
            <div className={styles.actions}>
              <Button
                to={startProjectHref({
                  source: pageSource,
                  service: content.nationalServiceSlug,
                })}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: pageSource }}
              >
                Discuss your project
              </Button>
              <Link className="link-underline" to={routePaths.pricing}>
                View pricing
              </Link>
            </div>
          </div>
        </section>

        {content.faqs.length ? (
          <section className="section section--tight">
            <div className="shell">
              <h2 className="text-h2">Questions</h2>
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
