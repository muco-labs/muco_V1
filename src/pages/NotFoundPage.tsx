import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageMeta } from '@/components/seo/PageMeta'
import { Container } from '@/components/ui/Container'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import styles from './NotFoundPage.module.css'

const notFound = pageSeo.notFound

export function NotFoundPage() {
  return (
    <>
      <PageMeta
        documentTitle={notFound.documentTitle}
        description={notFound.description}
        path={notFound.path}
        noIndex
      />
      <section className={styles.page}>
        <Container size="md">
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>Page not found</h1>
          <p className={styles.lead}>
            The page you requested is not available. Explore our services or start a project with
            MUCO LABS.
          </p>
          <div className={styles.actions}>
            <Button to={routePaths.home}>Back to home</Button>
            <Button to={routePaths.services} variant="secondary">
              View services
            </Button>
            <Button
              to={startProjectHref({ source: '404' })}
              variant="ghost"
              trackEvent={analyticsEvents.startProjectClick}
              trackParams={{ source: '404' }}
            >
              Start a Project
            </Button>
            <Link to={routePaths.contact}>Contact</Link>
          </div>
        </Container>
      </section>
    </>
  )
}
