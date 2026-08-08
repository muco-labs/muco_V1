import { Button } from '@/components/ui/Button'
import styles from './ErrorState.module.css'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.wrap} role="alert">
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
