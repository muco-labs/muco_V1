import { Link } from 'react-router-dom'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { adminPortalPaths } from '@/config/admin-portal'
import { Button } from '@/components/ui/Button'
import { adminApi } from '@/services/admin-portal'
import { ApiError } from '@/services/api'
import styles from './CrmProjectFulfillmentPanel.module.css'

type CrmProjectFulfillmentPanelProps = {
  leadId: string
  lead: Record<string, unknown>
  linkedProject?: Record<string, unknown> | null
  canCreate: boolean
  onUpdated: () => void
}

export function CrmProjectFulfillmentPanel({
  leadId,
  lead,
  linkedProject,
  canCreate,
  onUpdated,
}: CrmProjectFulfillmentPanelProps) {
  const customerRequestReference = lead.customerRequestReference
    ? String(lead.customerRequestReference)
    : null
  const lostOrArchived = lead.status === 'lost' || lead.status === 'archived'
  const hasCustomer = Boolean(lead.customerId)

  async function createProject() {
    if (!window.confirm('Create a delivery project from this lead?')) return
    try {
      await adminApi.leads.createProject(leadId)
      onUpdated()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not create project')
    }
  }

  return (
    <section className={`surface ${styles.panel}`} aria-labelledby="crm-project-fulfillment">
      <h2 id="crm-project-fulfillment" className="text-h3">
        Project fulfillment
      </h2>
      {customerRequestReference ? (
        <p className={ui.meta}>
          Source request: <strong>{customerRequestReference}</strong>
        </p>
      ) : null}

      {linkedProject ? (
        <div className={styles.linked}>
          <p>
            Project <strong>{String(linkedProject.reference)}</strong> —{' '}
            {String(linkedProject.name)}
          </p>
          <p className={ui.meta}>Status: {String(linkedProject.status)}</p>
          <Link
            className="link-underline"
            to={adminPortalPaths.projectDetail(String(linkedProject.id))}
          >
            Open project
          </Link>
        </div>
      ) : canCreate ? (
        <div>
          {lostOrArchived ? (
            <p className={ui.meta}>Cannot create a project from a lost or archived lead.</p>
          ) : !hasCustomer ? (
            <p className={ui.meta}>
              Link this lead to a customer account before creating a project.
            </p>
          ) : (
            <Button type="button" onClick={() => void createProject()}>
              Create project
            </Button>
          )}
        </div>
      ) : (
        <p className={ui.meta}>You do not have permission to create projects.</p>
      )}
    </section>
  )
}
