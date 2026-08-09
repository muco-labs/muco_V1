import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema, FaqPageSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { ProductWaitlistForm } from '@/components/product/ProductWaitlistForm'
import {
  clientHubConcept,
  clientHubProductSlug,
  clientHubSeo,
  productsHubSeo,
} from '@/content/products/client-hub'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from '@/pages/ErodePage.module.css'

export function ClientHubProductPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.productClientHubView, {})
  }, [])

  return (
    <>
      <PageMeta
        documentTitle={clientHubSeo.documentTitle}
        description={clientHubSeo.description}
        path={clientHubSeo.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Products', path: productsHubSeo.path },
          { name: clientHubConcept.name, path: clientHubSeo.path },
        ]}
      />
      <FaqPageSchema faqs={[...clientHubConcept.faqs]} />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link to={productsHubSeo.path}>Products</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Client Hub</span>
            </nav>
            <Reveal>
              <p className="text-label">{clientHubConcept.statusLabel}</p>
              <h1 className="text-display">{clientHubConcept.h1}</h1>
              <p className={styles.lead}>{clientHubConcept.lead}</p>
            </Reveal>
          </div>
        </header>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Problem</h2>
              <p className={styles.body}>{clientHubConcept.problem}</p>
            </Reveal>
            <Reveal delayMs={40}>
              <h2 className="text-h2">Direction</h2>
              <p className={styles.body}>{clientHubConcept.solution}</p>
            </Reveal>
            <Reveal delayMs={60}>
              <h2 className="text-h2">Who it is for</h2>
              <ul className={styles.list}>
                {clientHubConcept.forWho.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="text-h2">How it would work</h2>
              <ol className={styles.list}>
                {clientHubConcept.howItWorks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </Reveal>
            <Reveal delayMs={100}>
              <h2 className="text-h2">Pricing concept</h2>
              <p className={styles.body}>{clientHubConcept.pricingConcept}</p>
            </Reveal>
          </div>
        </section>

        <section className="section section--tight" id="waitlist">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Join the waitlist</h2>
              <p className={styles.body}>
                Help us validate the problem and scope. This is not a purchase and does not start a
                subscription.
              </p>
            </Reveal>
            <Reveal delayMs={60}>
              <div className={`surface ${styles.waitlistCard}`}>
                <ProductWaitlistForm
                  productSlug={clientHubProductSlug}
                  sourcePath={clientHubSeo.path}
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">FAQ</h2>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {clientHubConcept.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="text-h3">{faq.question}</dt>
                    <dd className={styles.body}>{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  )
}
