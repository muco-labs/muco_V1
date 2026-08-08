import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { clientHubProductSlug } from '@/content/products/client-hub'
import { productsHubSeo } from '@/content/products/client-hub'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from '@/pages/ErodePage.module.css'

export function ProductsPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.productsHubView, {})
  }, [])

  return (
    <>
      <PageMeta
        documentTitle={productsHubSeo.documentTitle}
        description={productsHubSeo.description}
        path={productsHubSeo.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Products', path: productsHubSeo.path },
        ]}
      />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Products</span>
            </nav>
            <Reveal>
              <p className="text-label">MUCO products · validation</p>
              <h1 className="text-display">Software we are building with real users in mind</h1>
              <p className={styles.lead}>
                MUCO LABS remains a services company. These products are separate bets we are
                validating before MVP—no fake customer counts or revenue claims.
              </p>
            </Reveal>
          </div>
        </header>
        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <article className="surface" style={{ padding: 'var(--space-5)' }}>
                <p className="text-label">Primary opportunity</p>
                <h2 className="text-h2">MUCO Client Hub</h2>
                <p className={styles.body}>
                  Client portal for agencies and service businesses—projects, files, invoices, and
                  support in one place.
                </p>
                <p className={styles.body}>
                  <strong>Status:</strong> waitlist / validation (not generally available).
                </p>
                <Link className="link-underline" to={`/products/${clientHubProductSlug}`}>
                  View concept & join waitlist
                </Link>
              </article>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  )
}
