import ui from '@/components/portal/CustomerPortalUi.module.css'
import { formatLeadActivityLabel } from '@/lib/crm/activity-labels'
import styles from './CrmActivityTimeline.module.css'

type TimelineItem = {
  id: string
  kind: 'activity' | 'interaction'
  at: string
  title: string
  detail?: string
}

type CrmActivityTimelineProps = {
  activities: Array<Record<string, unknown>>
  interactions: Array<Record<string, unknown>>
}

export function CrmActivityTimeline({ activities, interactions }: CrmActivityTimelineProps) {
  const items: TimelineItem[] = [
    ...activities.map((a) => ({
      id: `a-${String(a.id)}`,
      kind: 'activity' as const,
      at: String(a.createdAt),
      title: formatLeadActivityLabel(String(a.action), a.metadata ? String(a.metadata) : null),
    })),
    ...interactions.map((i) => ({
      id: `i-${String(i.id)}`,
      kind: 'interaction' as const,
      at: String(i.occurredAt ?? i.createdAt),
      title: `${String(i.interactionType).charAt(0).toUpperCase()}${String(i.interactionType).slice(1)}`,
      detail: String(i.summary),
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  if (items.length === 0) {
    return <p className={ui.meta}>No activity logged yet.</p>
  }

  return (
    <ul className={styles.timeline}>
      {items.map((item) => (
        <li key={item.id} className={`surface ${ui.dataCard} ${styles.item}`}>
          <p className={styles.title}>{item.title}</p>
          {item.detail ? <p className={ui.meta}>{item.detail}</p> : null}
          <time className={ui.meta} dateTime={item.at}>
            {new Date(item.at).toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  )
}
