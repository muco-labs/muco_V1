import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema, FaqPageSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { routePaths } from '@/config/routes'
import {
  tamilNaduContactBlurb,
  tamilNaduFaqs,
  tamilNaduHub,
  tamilNaduHubSeo,
  tamilNaduRelatedLinks,
  tamilNaduServiceLinks,
} from '@/content/market/tamil-nadu'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import styles from './ErodePage.module.css'

export function TamilNaduPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.tamilNaduPageView, {})
  }, [])

  return (
    <>
      <PageMeta
        documentTitle={tamilNaduHubSeo.documentTitle}
        description={tamilNaduHubSeo.description}
        path={tamilNaduHubSeo.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Tamil Nadu', path: tamilNaduHub.path },
        ]}
      />
      <FaqPageSchema faqs={[...tamilNaduFaqs]} />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={routePaths.home}>Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Tamil Nadu</span>
            </nav>
            <Reveal>
              <p className="text-label">Tamil Nadu, India</p>
              <h1 className="text-display">{tamilNaduHub.h1}</h1>
              <p className={styles.lead}>{tamilNaduHub.lead}</p>
            </Reveal>
          </div>
        </header>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">How we cover Tamil Nadu</h2>
              <ul className={styles.list}>
                {tamilNaduHub.coverage.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delayMs={60}>
              <h2 className="text-h2">Remote delivery</h2>
              <p className={styles.body}>{tamilNaduHub.remote}</p>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="text-h2">Industries</h2>
              <p className={styles.body}>{tamilNaduHub.industries}</p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <h2 className="text-h2">Core services</h2>
            <ul className={styles.serviceLinks}>
              {tamilNaduServiceLinks.map((item) => (
                <li key={item.slug}>
                  <Link className="link-underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className={styles.serviceLinks}>
              {tamilNaduRelatedLinks.map((item) => (
                <li key={item.href}>
                  <Link className="link-underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button
                to={startProjectHref({ source: 'tamil_nadu_hub' })}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'tamil_nadu_hub' }}
              >
                Discuss your project
              </Button>
              <Link className="link-underline" to={routePaths.work}>
                View work
              </Link>
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <h2 className="text-h2">Questions</h2>
            <dl className={styles.faq}>
              {tamilNaduFaqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-h3">{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.contact}>{tamilNaduContactBlurb}</p>
          </div>
        </section>
      </div>
    </>
  )
}
