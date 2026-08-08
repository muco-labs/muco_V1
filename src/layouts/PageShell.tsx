import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { PageMeta } from '@/components/seo/PageMeta'
import styles from './PageShell.module.css'

type PageShellProps = {
  title: string
  description?: string
  path: string
  children?: ReactNode
  headingLevel?: 'h1' | 'h2'
}

export function PageShell({
  title,
  description,
  path,
  children,
}: PageShellProps) {
  return (
    <>
      <PageMeta title={title} description={description} path={path} />
      <section className={styles.page}>
        <Container size="lg">
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            {description ? <p className={styles.lead}>{description}</p> : null}
          </header>
          {children ? <div className={styles.content}>{children}</div> : null}
        </Container>
      </section>
    </>
  )
}
