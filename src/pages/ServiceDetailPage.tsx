import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import {
  BreadcrumbSchema,
  FaqPageSchema,
  ServiceSchema,
} from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { getServiceSeo } from '@/config/seo'
import { env } from '@/config/env'
import { routePaths, servicePath } from '@/config/routes'
import { getServiceContent } from '@/data/service-content'
import { serviceFaqs, serviceRelatedSlugs } from '@/data/service-seo'
import { getServiceBySlug } from '@/data/services'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from './ServiceDetailPage.module.css'

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const meta = slug ? getServiceBySlug(slug) : undefined
  const content = slug ? getServiceContent(slug) : undefined

  useEffect(() => {
    if (!content) return
    trackEvent(analyticsEvents.serviceView, { service_slug: content.slug })
  }, [content])

  if (!meta || !content) {
    return <Navigate to="/404" replace />
  }

  const seo = getServiceSeo(content.slug)
  const url = `${env.siteUrl}/services/${content.slug}`
  const faqs = serviceFaqs[content.slug] ?? []
  const related = serviceRelatedSlugs[content.slug] ?? []

  return (
    <>
      <PageMeta
        documentTitle={seo.documentTitle}
        description={seo.description}
        path={seo.path}
      />
      <ServiceSchema name={seo.h1} description={seo.description} url={url} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: seo.h1, path: seo.path },
        ]}
      />
      <FaqPageSchema faqs={faqs} />
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
            <Reveal>
              <p className="text-label">{content.category}</p>
              <h1 className="text-display">{seo.h1}</h1>
              <p className={styles.summary}>{content.summary}</p>
            </Reveal>
          </div>
        </header>

        <div className="shell section section--tight">
          <div className={styles.grid}>
            <Reveal>
              <section>
                <h2 className="text-h3">Who it&apos;s for</h2>
                <p>{content.forWho}</p>
              </section>
            </Reveal>
            <Reveal delayMs={80}>
              <section>
                <h2 className="text-h3">The problem</h2>
                <p>{content.problem}</p>
              </section>
            </Reveal>
            <Reveal>
              <section className="surface">
                <h2 className="text-h3">What we build</h2>
                <ul>
                  {content.builds.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </Reveal>
            <Reveal delayMs={80}>
              <section className="surface">
                <h2 className="text-h3">What you get</h2>
                <ul>
                  {content.outcomes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </Reveal>
          </div>

          <Reveal className={styles.why}>
            <h2 className="text-h2">Why it matters</h2>
            <p>{content.whyItMatters}</p>
          </Reveal>

          <Reveal className={styles.process}>
            <h2 className="text-h3">How we work</h2>
            <ol>
              {content.process.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Reveal>

          {content.erodeNote ? (
            <Reveal>
              <p className={styles.erode}>{content.erodeNote}</p>
            </Reveal>
          ) : null}

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

          <div className={styles.actions}>
            <Button
              to={routePaths.contact}
              size="lg"
              trackEvent={analyticsEvents.startProjectClick}
              trackParams={{ source: 'service_detail', service_slug: content.slug }}
            >
              Start a Project
            </Button>
            <Link className="link-underline" to={routePaths.work}>
              View concept work
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
