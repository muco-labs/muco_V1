import { Link } from 'react-router-dom'
import { CustomerStatusChip } from '@/components/portal/CustomerRequestStatus'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { customerPortalPaths } from '@/config/customer-portal'
import { formatProjectRequestReference, projectRequestNextAction } from '@/lib/conversion/project-request-reference'
import styles from './ProjectRequestListItem.module.css'

export type ProjectRequestListItemData = {
  id: string
  status: string
  serviceInterest: string | null
  createdAt: string
  updatedAt?: string
}

type ProjectRequestListItemProps = {
  row: ProjectRequestListItemData
}

export function ProjectRequestListItem({ row }: ProjectRequestListItemProps) {
  const updated = row.updatedAt ?? row.createdAt
  const showUpdated = row.updatedAt && row.updatedAt !== row.createdAt

  return (
    <article className={`surface ${ui.dataCard} ${styles.card}`}>
      <div className={styles.header}>
        <Link className="link-underline" to={customerPortalPaths.projectRequestDetail(row.id)}>
          <h2 className="text-h3">{row.serviceInterest ?? 'Project request'}</h2>
        </Link>
        <CustomerStatusChip status={row.status} />
      </div>
      <p className={ui.meta}>
        Ref. {formatProjectRequestReference(row.id)} · Submitted{' '}
        {new Date(row.createdAt).toLocaleDateString()}
        {showUpdated ? ` · Updated ${new Date(updated).toLocaleDateString()}` : ''}
      </p>
      <p className={styles.next}>{projectRequestNextAction(row.status)}</p>
    </article>
  )
}
