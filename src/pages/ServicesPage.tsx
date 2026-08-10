import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/design-system/PageHero'
import { ServiceCard } from '@/components/design-system/ServiceCard'
import { FinalCta } from '@/components/design-system/FinalCta'
import { DecorativeScene } from '@/components/three/DecorativeScene'
import { HeroSceneFallback } from '@/components/three/HeroSceneFallback'
import { serviceHighlights } from '@/content/services-catalog'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { Button } from '@/components/ui/Button'
import styles from './ServicesPage.module.css'

const services = pageSeo.services

export function ServicesPage() {
  return (
    <>
      <PageMeta
        documentTitle={services.documentTitle}
        description={services.description}
        path={services.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: services.path },
        ]}
      />
      <div className={styles.page}>
        <PageHero
          eyebrow="Services"
          title="A complete technology ecosystem."
          lead="Websites, software, mobile, AI, automation and growth—scoped clearly and delivered with founder-led oversight from Erode."
          visual={
            <DecorativeScene
              sceneId="services-constellation"
              scene={() => import('@/components/three/scenes/ServiceConstellationScene')}
              fallback={<HeroSceneFallback />}
            />
          }
        />
        <section className="section">
          <div className="shell">
            <div className={styles.grid}>
              {serviceHighlights.map((service, index) => (
                <Reveal key={service.slug} delayMs={index * 50}>
                  <ServiceCard service={service} />
                </Reveal>
              ))}
            </div>
            <div className={styles.cta}>
              <Button to={startProjectHref({ source: 'services' })}>Start a project</Button>
              <Link className="link-underline" to={routePaths.pricing}>
                See pricing
              </Link>
            </div>
          </div>
        </section>
        <FinalCta source="services" title="Ready to scope your build?" body="Tell us what you are shipping—we will respond with a practical next step." />
      </div>
    </>
  )
}
