import { Link } from 'react-router-dom'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { adminPortalPaths } from '@/config/admin-portal'
import { Button } from '@/components/ui/Button'
import { adminApi } from '@/services/admin-portal'
import { ApiError } from '@/services/api'
import styles from './CrmProjectFulfillmentPanel.module.css'

type CrmProposalFulfillmentPanelProps = {
  leadId: string
  lead: Record<string, unknown>
  proposals: Array<Record<string, unknown>>
  canCreate: boolean
  onUpdated: () => void
}

export function CrmProposalFulfillmentPanel({
  leadId,
  lead,
  proposals,
  canCreate,
  onUpdated,
}: CrmProposalFulfillmentPanelProps) {
  const lostOrArchived = lead.status === 'lost' || lead.status === 'archived'
  const hasCustomer = Boolean(lead.customerId)
  const openProposal = proposals.find((p) =>
    ['draft', 'sent', 'viewed', 'changes_requested'].includes(String(p.status)),
  )

  async function createProposal() {
    if (!window.confirm('Create a draft proposal for this lead?')) return
    try {
      await adminApi.proposals.createFromLead(leadId, {})
      onUpdated()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not create proposal')
    }
  }

  return (
    <section className={`surface ${styles.panel}`} aria-labelledby="crm-proposal-fulfillment">
      <h2 id="crm-proposal-fulfillment" className="text-h3">
        Proposals
      </h2>
      {openProposal ? (
        <div className={styles.linked}>
          <p>
            <strong>{String(openProposal.reference ?? openProposal.title)}</strong>
          </p>
          <p className={ui.meta}>Status: {String(openProposal.status)}</p>
          <Link className="link-underline" to={adminPortalPaths.proposalDetail(String(openProposal.id))}>
            Open proposal
          </Link>
        </div>
      ) : canCreate ? (
        <div>
          {lostOrArchived ? (
            <p className={ui.meta}>Cannot create a proposal from a lost or archived lead.</p>
          ) : !hasCustomer ? (
            <p className={ui.meta}>Link this lead to a customer account before creating a proposal.</p>
          ) : (
            <Button type="button" onClick={() => void createProposal()}>
              Create proposal
            </Button>
          )}
        </div>
      ) : (
        <p className={ui.meta}>You do not have permission to create proposals.</p>
      )}
      {proposals.length > 0 ? (
        <ul className={ui.stack} style={{ marginTop: 'var(--space-3)' }}>
          {proposals.map((p) => (
            <li key={String(p.id)} className={ui.meta}>
              <Link className="link-underline" to={adminPortalPaths.proposalDetail(String(p.id))}>
                {String(p.reference ?? p.title)}
              </Link>{' '}
              · {String(p.status)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
