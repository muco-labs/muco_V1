import {
  PROJECT_REQUEST_LIFECYCLE,
  lifecycleStepState,
  presentProjectRequestStatus,
} from '@/lib/customer/project-request-lifecycle'
import styles from './ProjectRequestLifecycle.module.css'

type ProjectRequestLifecycleProps = {
  status: string
}

export function ProjectRequestLifecycle({ status }: ProjectRequestLifecycleProps) {
  const presentation = presentProjectRequestStatus(status)

  return (
    <ol className={styles.list} aria-label="Project request lifecycle">
      {PROJECT_REQUEST_LIFECYCLE.map((step, index) => {
        const state = lifecycleStepState(index, presentation.lifecycleIndex, presentation.tone)
        return (
          <li
            key={step.id}
            className={`${styles.item} ${styles[state]}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className={styles.marker} aria-hidden="true" />
            <div>
              <p className={styles.stepLabel}>{step.label}</p>
              <p className={styles.stepSummary}>{step.summary}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
