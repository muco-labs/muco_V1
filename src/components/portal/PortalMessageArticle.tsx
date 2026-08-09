import ui from '@/components/portal/CustomerPortalUi.module.css'
import { formatMessageBodyForDisplay } from '@/lib/portal/message-display'

type Props = {
  id: string
  senderLabel: string
  body: string
  createdAt: string
  unread?: boolean
  unreadAriaLabel?: string
}

export function PortalMessageArticle({
  id,
  senderLabel,
  body,
  createdAt,
  unread,
  unreadAriaLabel = 'Unread message',
}: Props) {
  return (
    <article key={id} className={ui.messageItem}>
      <p className={ui.meta}>
        <strong>{senderLabel}</strong>
        {unread ? <span aria-label={unreadAriaLabel}> · Unread</span> : null}
      </p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{formatMessageBodyForDisplay(body)}</p>
      <time dateTime={createdAt}>{new Date(createdAt).toLocaleString()}</time>
    </article>
  )
}
