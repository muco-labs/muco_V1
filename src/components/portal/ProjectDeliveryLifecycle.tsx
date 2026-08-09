import {
  PROJECT_DELIVERY_LIFECYCLE,
  projectLifecycleIndex,
  projectLifecycleStepState,
} from '@/lib/customer/project-delivery-lifecycle'
import styles from './ProjectRequestLifecycle.module.css'

type ProjectDeliveryLifecycleProps = {
  status: string
}

export function ProjectDeliveryLifecycle({ status }: ProjectDeliveryLifecycleProps) {
  const currentIndex = projectLifecycleIndex(status)

  return (
    <ol className={styles.list} aria-label="Project delivery lifecycle">
      {PROJECT_DELIVERY_LIFECYCLE.map((step, index) => {
        const state = projectLifecycleStepState(index, currentIndex)
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
