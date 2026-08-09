import { presentProjectRequestStatus } from '@/lib/customer/project-request-lifecycle'
import styles from './CustomerRequestStatus.module.css'

type CustomerRequestStatusProps = {
  status: string
  compact?: boolean
}

export function CustomerRequestStatus({ status, compact = false }: CustomerRequestStatusProps) {
  const presentation = presentProjectRequestStatus(status)

  return (
    <div
      className={`${styles.wrap} ${styles[presentation.tone]}`}
      role="status"
      aria-label={`Status: ${presentation.label}. ${presentation.description}`}
    >
      <p className={styles.label}>{presentation.label}</p>
      {!compact ? (
        <>
          <p className={styles.headline}>{presentation.headline}</p>
          <p className={styles.description}>{presentation.description}</p>
        </>
      ) : null}
    </div>
  )
}

export function CustomerStatusChip({ status }: { status: string }) {
  const { label, tone } = presentProjectRequestStatus(status)
  const toneClass =
    tone === 'active'
      ? styles.chip_active
      : tone === 'complete'
        ? styles.chip_complete
        : tone === 'cancelled'
          ? styles.chip_cancelled
          : styles.chip_pending
  return <span className={`${styles.chip} ${toneClass}`}>{label}</span>
}
