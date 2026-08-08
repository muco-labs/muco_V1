import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageMeta } from '@/components/seo/PageMeta'
import { Container } from '@/components/ui/Container'
import { routePaths } from '@/config/routes'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page not found" path="/404" noIndex />
      <section className={styles.page}>
        <Container size="md">
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>Page not found</h1>
          <p className={styles.lead}>
            The page you requested is not available. Try the main navigation or return home.
          </p>
          <div className={styles.actions}>
            <Button to={routePaths.home}>Back to home</Button>
            <Link to={routePaths.contact}>Contact</Link>
          </div>
        </Container>
      </section>
    </>
  )
}
