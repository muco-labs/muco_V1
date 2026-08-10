import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { PageHero } from '@/components/design-system/PageHero'
import { FinalCta } from '@/components/design-system/FinalCta'
import { Reveal } from '@/components/motion/Reveal'
import { DecorativeScene } from '@/components/three/DecorativeScene'
import { HeroSceneFallback } from '@/components/three/HeroSceneFallback'
import { clientHubProductSlug } from '@/content/products/client-hub'
import { productsHubSeo } from '@/content/products/client-hub'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import styles from './ProductsPage.module.css'

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
        <PageHero
          eyebrow="MUCO products · validation"
          title="Software we are building with real users in mind"
          lead="MUCO LABS remains a services company. These products are separate bets we are validating before MVP—no fake customer counts or revenue claims."
          visual={
            <DecorativeScene
              sceneId="products-core"
              scene={() => import('@/components/three/scenes/ProductCoreScene')}
              fallback={<HeroSceneFallback />}
            />
          }
        />
        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <article className={`surface ${styles.productCard}`}>
                <DecorativeScene
                  sceneId="products-core-card"
                  className={styles.productScene}
                  scene={() => import('@/components/three/scenes/ProductCoreScene')}
                  fallback={null}
                />
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
        <FinalCta
          source="products"
          title="Building a product too?"
          body="We help founders ship MVPs with the same clarity we apply to our own bets."
          secondaryLabel="Our services"
          secondaryHref="/services"
        />
      </div>
    </>
  )
}
