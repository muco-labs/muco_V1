import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { PageMeta } from '@/components/seo/PageMeta'
import styles from './PageShell.module.css'

type PageShellProps = {
  /** Visible H1 on the page */
  title: string
  /** Full browser title; defaults to `{title} | MUCO LABS` via PageMeta */
  documentTitle?: string
  description?: string
  path: string
  children?: ReactNode
  noIndex?: boolean
}

export function PageShell({
  title,
  documentTitle,
  description,
  path,
  children,
  noIndex,
}: PageShellProps) {
  return (
    <>
      <PageMeta
        documentTitle={documentTitle}
        title={documentTitle ? undefined : title}
        description={description}
        path={path}
        noIndex={noIndex}
      />
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
