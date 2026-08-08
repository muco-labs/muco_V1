import { Link, Navigate, useParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { ServiceSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { env } from '@/config/env'
import { routePaths } from '@/config/routes'
import { getServiceContent } from '@/data/service-content'
import { getServiceBySlug } from '@/data/services'
import styles from './ServiceDetailPage.module.css'

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const meta = slug ? getServiceBySlug(slug) : undefined
  const content = slug ? getServiceContent(slug) : undefined

  if (!meta || !content) {
    return <Navigate to="/404" replace />
  }

  const url = `${env.siteUrl}/services/${content.slug}`

  return (
    <>
      <PageMeta title={content.title} description={content.summary} path={`/services/${content.slug}`} />
      <ServiceSchema name={content.title} description={content.summary} url={url} />
      <article className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">{content.category}</p>
              <h1 className="text-display">{content.title}</h1>
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

          <div className={styles.actions}>
            <Button to={routePaths.contact} size="lg">
              Start a Project
            </Button>
            <Link className="link-underline" to={routePaths.services}>
              All services
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}
