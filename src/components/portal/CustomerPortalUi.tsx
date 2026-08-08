import type { ReactNode } from 'react'
import styles from './CustomerPortalUi.module.css'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyDesc}>{description}</p>
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={styles.skeletonList} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  )
}

export function PortalError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={styles.error} role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  return <span className={styles.pill}>{status.replace(/_/g, ' ')}</span>
}

export function PageIntro({ label, title, description }: { label?: string; title: string; description?: string }) {
  return (
    <header className={styles.pageIntro}>
      {label ? <p className="text-label">{label}</p> : null}
      <h1 className="text-h2">{title}</h1>
      {description ? <p className={styles.pageDesc}>{description}</p> : null}
    </header>
  )
}
