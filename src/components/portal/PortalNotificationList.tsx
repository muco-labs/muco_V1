import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { notificationHref, type PortalKind } from '@/lib/portal/notification-links'

export type PortalNotificationItem = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

type Props = {
  portal: PortalKind
  items: PortalNotificationItem[]
  onMarkRead: (id: string) => Promise<void>
}

export function PortalNotificationList({ portal, items, onMarkRead }: Props) {
  return (
    <ul className={ui.stack}>
      {items.map((n) => {
        const href = notificationHref(portal, n.type)
        return (
          <li key={n.id} className={`surface ${ui.dataCard}`}>
            <div className={ui.actionsRow} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <strong>{n.title}</strong>
              <span className={ui.meta}>
                {n.read ? (
                  <span>Read</span>
                ) : (
                  <span aria-label="Unread notification">Unread</span>
                )}
              </span>
            </div>
            <p className={ui.meta}>{n.message}</p>
            <time className={ui.meta} dateTime={n.createdAt}>
              {new Date(n.createdAt).toLocaleString()}
            </time>
            <div className={ui.actionsRow} style={{ marginTop: 'var(--space-2)' }}>
              {href ? (
                <Link className="link-underline" to={href}>
                  View related area
                </Link>
              ) : null}
              {!n.read ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => void onMarkRead(n.id)}>
                  Mark read
                </Button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
