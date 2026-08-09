import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PageIntro,
  PortalError,
  ProjectSectionNav,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { customerPortalPaths } from '@/config/customer-portal'
import { useAuth } from '@/contexts/auth-context'
import { useFetch } from '@/hooks/useFetch'
import { customerApi } from '@/services/customer-portal'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'
import { friendlyCustomerPortalError, paymentStatusTone } from '@/lib/customer/portal-errors'
import { ProjectRequestListItem } from '@/components/portal/ProjectRequestListItem'
import { CustomerRequestStatus } from '@/components/portal/CustomerRequestStatus'
import { ProjectRequestLifecycle } from '@/components/portal/ProjectRequestLifecycle'
import detailStyles from '@/components/portal/ProjectRequestDetail.module.css'
import { formatProjectRequestReference, projectRequestNextAction } from '@/lib/conversion/project-request-reference'

import { ProjectDeliveryLifecycle } from '@/components/portal/ProjectDeliveryLifecycle'
import { formatCommercialMoney } from '@/lib/commercial/format-money'
import { runCustomerPaymentCheckout } from '@/lib/commercial/customer-payment-checkout'
import { customerPaymentStatusLabel } from '@/lib/commercial/payment-status-label'
import { CustomerMessageMucoButton } from '@/components/portal/CustomerMessageMucoButton'
import { ProjectDocumentsSection } from '@/components/portal/ProjectDocumentsSection'
import { PortalMessageArticle } from '@/components/portal/PortalMessageArticle'
import {
  PortalNotificationList,
  type PortalNotificationItem,
} from '@/components/portal/PortalNotificationList'
import type { CustomerConversationListItem, CustomerConversationMessage } from '@/services/customer-portal'

function formatMoney(amount: string, currency: string) {
  return formatCommercialMoney(amount, currency)
}

type ProjectRow = {
  id: string
  reference: string
  name: string
  service?: string | null
  status: string
  statusLabel?: string
  startDate?: string | null
  expectedCompletion?: string | null
  updatedAt?: string
  progressPercent: number | null
  sourceRequestReference?: string | null
}

export function CustomerProjectsPage() {
  const { data, error, loading, reload } = useFetch(
    () => customerApi.projects.list() as Promise<{ items: ProjectRow[] }>,
    [],
  )

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <PageIntro title="Projects" description="Track delivery status and next steps for your MUCO projects." />
      {items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Your projects will appear here once a project has been created."
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((project) => (
            <li key={project.id} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={customerPortalPaths.projectDetail(project.id)}>
                <h2 className="text-h3">{project.name}</h2>
              </Link>
              <p className={ui.meta}>
                {project.reference}
                {project.service ? ` · ${project.service}` : ''}
              </p>
              <StatusPill status={project.statusLabel ?? project.status} />
              {project.startDate ? (
                <p className={ui.meta}>
                  Started {new Date(project.startDate).toLocaleDateString()}
                  {project.expectedCompletion
                    ? ` · Target ${new Date(project.expectedCompletion).toLocaleDateString()}`
                    : ''}
                </p>
              ) : null}
              {project.updatedAt ? (
                <p className={ui.meta}>Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
              ) : null}
              {project.progressPercent != null ? (
                <div className={ui.progressBar} aria-label={`Progress ${project.progressPercent}%`}>
                  <span style={{ width: `${project.progressPercent}%` }} />
                </div>
              ) : (
                <p className={ui.meta}>Milestones will appear as your project progresses.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CustomerProjectDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(
    () => customerApi.projects.get(id),
    [id],
  )

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const project = data.project as Record<string, unknown>
  const milestones = (data.milestones as Array<Record<string, unknown>>) ?? []
  const progressPercent = data.progressPercent as number | null
  const statusLabel = String(project.statusLabel ?? project.status ?? '')
  const nextStep = project.nextStep ? String(project.nextStep) : null
  const proposalReference = data.proposalReference ? String(data.proposalReference) : null
  const currentMilestone = data.currentMilestone as Record<string, unknown> | null | undefined
  const nextMilestone = data.nextMilestone as Record<string, unknown> | null | undefined
  const customerNextAction = data.customerNextAction ? String(data.customerNextAction) : null
  const lastUpdate = data.lastUpdate as Record<string, unknown> | null | undefined
  const activities = (data.activities as Array<Record<string, unknown>>) ?? []

  return (
    <>
      <PageIntro
        label="Project"
        title={String(project.name ?? 'Project')}
        description={
          project.reference
            ? `${String(project.reference)}${project.service ? ` · ${String(project.service)}` : ''}`
            : undefined
        }
      />
      <ProjectSectionNav
        items={[
          { href: '#project-lifecycle', label: 'Progress' },
          { href: '#project-milestones', label: 'Milestones' },
          ...(activities.length > 0 ? [{ href: '#project-activity', label: 'Updates' }] : []),
          { href: '#project-files', label: 'Files' },
        ]}
      />
      {project.sourceRequestReference ? (
        <p className={ui.meta}>
          From request {String(project.sourceRequestReference)}
        </p>
      ) : null}
      {proposalReference ? (
        <p className={ui.meta}>
          Proposal {proposalReference}
        </p>
      ) : null}
      <p className={ui.meta}>
        <strong>Current status:</strong> {statusLabel}
      </p>
      {nextStep ? (
        <p className={ui.meta}>
          <strong>Next step:</strong> {nextStep}
        </p>
      ) : null}
      {customerNextAction ? (
        <p className={ui.meta} role="status">
          <strong>Your next action:</strong> {customerNextAction}
        </p>
      ) : null}
      {lastUpdate ? (
        <p className={ui.meta}>
          Last update: {new Date(String(lastUpdate.createdAt)).toLocaleString()}
        </p>
      ) : null}
      {project.description ? <p style={{ marginTop: 'var(--space-4)' }}>{String(project.description)}</p> : null}

      <section style={{ marginTop: 'var(--space-6)' }} aria-labelledby="project-lifecycle">
        <h2 id="project-lifecycle" className="text-h3">
          Delivery progress
        </h2>
        <ProjectDeliveryLifecycle status={String(project.status ?? 'draft')} />
      </section>

      {(project.startDate || project.expectedCompletion) && (
        <dl className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
          {project.startDate ? (
            <div>
              <dt className={ui.meta}>Start date</dt>
              <dd>{new Date(String(project.startDate)).toLocaleDateString()}</dd>
            </div>
          ) : null}
          {project.expectedCompletion ? (
            <div>
              <dt className={ui.meta}>Target date</dt>
              <dd>{new Date(String(project.expectedCompletion)).toLocaleDateString()}</dd>
            </div>
          ) : null}
        </dl>
      )}

      {progressPercent != null ? (
        <div className={ui.progressBar} style={{ marginTop: 'var(--space-3)' }} aria-label={`Progress ${progressPercent}%`}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      ) : (
        <p className={ui.meta} style={{ marginTop: 'var(--space-3)' }}>
          Milestones will appear as your project progresses.
        </p>
      )}

      {currentMilestone ? (
        <p className={ui.meta} role="status" style={{ marginTop: 'var(--space-4)' }}>
          <strong>Current milestone:</strong> {String(currentMilestone.name)} (
          {String(currentMilestone.statusLabel ?? currentMilestone.status)})
          {currentMilestone.overdueNote ? (
            <span> · {String(currentMilestone.overdueNote)}</span>
          ) : null}
        </p>
      ) : null}
      {nextMilestone ? (
        <p className={ui.meta}>
          <strong>Up next:</strong> {String(nextMilestone.name)}
        </p>
      ) : null}

      <section id="project-milestones" style={{ marginTop: 'var(--space-8)' }} aria-labelledby="project-milestones-heading">
        <h2 id="project-milestones-heading" className="text-h3">
          Milestones
        </h2>
        {milestones.length === 0 ? (
          <EmptyState title="No milestones yet" description="Milestone updates will appear here when they are added." />
        ) : (
          <ol className={ui.timeline}>
            {milestones.map((m) => (
              <li key={String(m.key ?? m.name)}>
                <strong>{String(m.name)}</strong>
                <StatusPill status={String(m.statusLabel ?? m.status)} />
                {m.dueDate ? (
                  <time className={ui.meta} dateTime={String(m.dueDate)}>
                    Due {new Date(String(m.dueDate)).toLocaleDateString()}
                    {m.dueHint === 'overdue' ? ' · Overdue' : ''}
                  </time>
                ) : null}
                {m.description ? <p className={ui.meta}>{String(m.description)}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {activities.length > 0 ? (
        <section style={{ marginTop: 'var(--space-8)' }} aria-labelledby="project-activity">
          <h2 id="project-activity" className="text-h3">
            Recent updates
          </h2>
          <ul className={ui.stack}>
            {activities.map((a) => (
              <li key={`${String(a.action)}-${String(a.createdAt)}`} className={ui.meta}>
                <time dateTime={String(a.createdAt)}>{new Date(String(a.createdAt)).toLocaleString()}</time>
                {' · '}
                {String(a.action).replaceAll('.', ' ')}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div style={{ marginTop: 'var(--space-8)' }}>
        <CustomerMessageMucoButton heading="Need help with this project?" projectId={id} />
      </div>

      <ProjectDocumentsSection projectId={id} />

      <p style={{ marginTop: 'var(--space-6)' }}>
        <Link className="link-underline" to={customerPortalPaths.projects}>
          Back to projects
        </Link>
      </p>
    </>
  )
}

export function CustomerProposalsPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.proposals.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro title="Proposals" description="Review scope, pricing, and approve when ready." />
      {items.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          description="When MUCO sends a proposal, you can review scope and pricing here."
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((p) => (
            <li key={String(p.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={customerPortalPaths.proposalDetail(String(p.id))}>
                {String(p.title ?? 'Proposal')}
              </Link>
              <p className={ui.meta}>
                {p.reference ? String(p.reference) : null}
                {p.currency ? ` · ${String(p.currency)}` : ''}
              </p>
              <StatusPill status={String(p.statusLabel ?? p.status)} />
              {p.amount ? <span className={ui.meta}>{String(p.amount)}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CustomerProposalDetailPage() {
  const { id = '' } = useParams()
  const [note, setNote] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const [payMessage, setPayMessage] = useState<string | null>(null)
  const { data, error, loading, reload } = useFetch(() => customerApi.proposals.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const canDecide = Boolean(data.canAcceptOrReject)
  const statusLabel = String(data.statusLabel ?? data.status)
  const nextAction = data.nextAction ? String(data.nextAction) : null
  const currency = String(data.currency ?? 'INR')
  const expired = Boolean(data.expired)
  const payment = data.payment as Record<string, unknown> | null | undefined
  const projectId = data.projectId ? String(data.projectId) : null

  async function handleProposalPay() {
    setPayLoading(true)
    setPayMessage(null)
    const result = await runCustomerPaymentCheckout({
      startIntent: () => customerApi.proposals.startPayment(id),
      verifyOnServer: async (paymentId, payload) => {
        await customerApi.payments.verify(paymentId, payload)
      },
      onAfterVerify: reload,
    })
    setPayMessage(result.message)
    setPayLoading(false)
  }

  async function decide(action: 'approve' | 'requestChanges' | 'reject') {
    const label =
      action === 'approve' ? 'accept this proposal' : action === 'reject' ? 'decline this proposal' : 'request changes'
    if (!window.confirm(`Are you sure you want to ${label}?`)) return
    setActionError(null)
    try {
      if (action === 'approve') await customerApi.proposals.approve(id, note)
      if (action === 'requestChanges') await customerApi.proposals.requestChanges(id, note)
      if (action === 'reject') await customerApi.proposals.reject(id, note)
      reload()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action failed.')
    }
  }

  return (
    <>
      <PageIntro
        title={String(data.title ?? 'Proposal')}
        description={data.reference ? String(data.reference) : undefined}
      />
      <p className={ui.meta}>
        <strong>Status:</strong> {statusLabel}
      </p>
      {nextAction ? (
        <p className={ui.meta} role="status">
          <strong>Next step:</strong> {nextAction}
        </p>
      ) : null}
      {data.projectReference ? (
        <p className={ui.meta}>Project {String(data.projectReference)}</p>
      ) : null}
      {data.sourceRequestReference ? (
        <p className={ui.meta}>Request {String(data.sourceRequestReference)}</p>
      ) : null}
      {expired ? (
        <p className={ui.meta}>This proposal is no longer valid.</p>
      ) : null}
      <div className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        {data.scope ? (
          <p>
            <strong>Scope.</strong> {String(data.scope)}
          </p>
        ) : null}
        {data.deliverables ? (
          <p>
            <strong>Deliverables.</strong> {String(data.deliverables)}
          </p>
        ) : null}
        {data.timeline ? (
          <p>
            <strong>Timeline.</strong> {String(data.timeline)}
          </p>
        ) : null}
        {data.terms ? (
          <p>
            <strong>Terms.</strong> {String(data.terms)}
          </p>
        ) : null}
        {data.amount ? (
          <p className={ui.meta}>
            Total: {currency} {String(data.amount)}
            {data.subtotal ? ` (subtotal ${String(data.subtotal)})` : ''}
          </p>
        ) : null}
        {data.discountAmount ? (
          <p className={ui.meta}>Includes authorized discount: ₹{String(data.discountAmount)}</p>
        ) : null}
        {data.validUntil ? (
          <p className={ui.meta}>Valid until {new Date(String(data.validUntil)).toLocaleDateString()}</p>
        ) : null}
        {data.paymentSchedule ? (
          <p className={ui.meta}>Payment schedule: {String(data.paymentSchedule).replaceAll('_', ' ')}</p>
        ) : null}
        {(data.lineItems as Array<Record<string, unknown>> | undefined)?.length ? (
          <section>
            <h2 className="text-h3">Pricing breakdown</h2>
            <ul className={ui.stack}>
              {(data.lineItems as Array<Record<string, unknown>>).map((item) => (
                <li key={String(item.id)} className={ui.meta}>
                  {String(item.description)} — {String(item.quantity)} × ₹{String(item.unitAmount)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      {payment && String(data.status) === 'accepted' ? (
        <section
          className={`surface ${ui.dataCard}`}
          style={{ marginTop: 'var(--space-6)' }}
          aria-labelledby="proposal-payment-heading"
        >
          <h2 className="text-h3" id="proposal-payment-heading">
            Payment
          </h2>
          {payment.status === 'paid' || payment.status === 'succeeded' ? (
            <p className={ui.meta} role="status">
              <strong>Payment successful.</strong>
              {payment.paymentReference ? (
                <>
                  {' '}
                  Reference: {String(payment.paymentReference)}
                </>
              ) : null}
              {payment.paidAt ? (
                <>
                  {' '}
                  · Paid {new Date(String(payment.paidAt)).toLocaleString()}
                </>
              ) : null}
            </p>
          ) : payment.paymentRequired === false && payment.reason ? (
            <p className={ui.meta}>{String(payment.reason)}</p>
          ) : payment.paymentRequired !== false ? (
            <>
              <p className={ui.meta} role="status">
                <strong>{customerPaymentStatusLabel(String(payment.status))}.</strong>
              </p>
              {payment.payableAmount ? (
                <p className={ui.meta}>
                  Amount: {formatMoney(String(payment.payableAmount), String(payment.currency ?? currency))}
                </p>
              ) : null}
              {payment.paymentReference ? (
                <p className={ui.meta}>Payment reference: {String(payment.paymentReference)}</p>
              ) : null}
              {payment.status === 'failed' || payment.lastFailed ? (
                <p className={ui.meta} role="status">
                  Your last payment attempt did not complete. You can try again.
                </p>
              ) : null}
              {payment.canPay ? (
                <div className={ui.actionsRow} style={{ marginTop: 'var(--space-4)' }}>
                  <Button type="button" disabled={payLoading} onClick={() => void handleProposalPay()}>
                    {payLoading ? 'Starting checkout…' : payment.status === 'failed' ? 'Retry payment' : 'Pay now'}
                  </Button>
                </div>
              ) : payment.payBlockedReason ? (
                <p className={ui.meta}>{String(payment.payBlockedReason)}</p>
              ) : null}
            </>
          ) : null}
          <div aria-live="polite" className={ui.meta}>
            {payMessage}
          </div>
          {payment.status === 'paid' && projectId ? (
            <p style={{ marginTop: 'var(--space-4)' }}>
              <Link className="link-underline" to={customerPortalPaths.projectDetail(projectId)}>
                View project
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
      {canDecide ? (
        <form
          className={ui.form}
          style={{ marginTop: 'var(--space-6)' }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div className={ui.field}>
            <label htmlFor="proposal-note">Note (optional)</label>
            <textarea
              id="proposal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
          </div>
          {actionError ? <PortalError message={actionError} /> : null}
          <div className={ui.actionsRow}>
            <Button type="button" onClick={() => void decide('approve')}>
              Accept
            </Button>
            <Button type="button" variant="secondary" onClick={() => void decide('requestChanges')}>
              Request changes
            </Button>
            <Button type="button" variant="ghost" onClick={() => void decide('reject')}>
              Decline
            </Button>
          </div>
        </form>
      ) : null}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <CustomerMessageMucoButton heading="Questions about this proposal?" proposalId={id} />
      </div>
    </>
  )
}

export function CustomerInvoicesPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.invoices.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro title="Invoices" description="View amounts due and payment status." />
      {items.length === 0 ? (
        <EmptyState title="No invoices" description="Your invoices will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((inv) => (
            <li key={String(inv.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={customerPortalPaths.invoiceDetail(String(inv.id))}>
                {String(inv.invoiceNumber)}
              </Link>
              <span className={ui.meta}>
                ₹{String(inv.amount)} · <StatusPill status={String(inv.status)} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CustomerInvoiceDetailPage() {
  const { id = '' } = useParams()
  const [payMessage, setPayMessage] = useState<string | null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const { data, error, loading, reload } = useFetch(() => customerApi.invoices.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const invoice = data.invoice as Record<string, unknown>
  const lines = (data.lineItems as Array<Record<string, unknown>>) ?? []

  async function handlePay() {
    setPayMessage(null)
    setPayLoading(true)
    const result = await runCustomerPaymentCheckout({
      startIntent: () => customerApi.invoices.pay(id),
      verifyOnServer: async (paymentId, payload) => {
        await customerApi.payments.verify(paymentId, payload)
      },
      onAfterVerify: reload,
    })
    setPayMessage(result.message)
    setPayLoading(false)
  }

  return (
    <>
      <PageIntro title={`Invoice ${String(invoice.invoiceNumber)}`} />
      <StatusPill status={String(invoice.status)} />
      <p className={ui.meta}>Total: ₹{String(invoice.amount)}</p>
      {lines.length > 0 ? (
        <ul className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          {lines.map((line) => (
            <li key={String(line.id)} className={ui.meta}>
              {String(line.description)} — ₹{String(line.unitAmount)} × {String(line.quantity)}
            </li>
          ))}
        </ul>
      ) : null}
      {['sent', 'partial', 'overdue'].includes(String(invoice.status)) ? (
        <div className={ui.actionsRow} style={{ marginTop: 'var(--space-6)' }}>
          <Button type="button" disabled={payLoading} onClick={() => void handlePay()}>
            {payLoading ? 'Starting checkout…' : 'Pay now'}
          </Button>
        </div>
      ) : null}
      <div aria-live="polite" className={ui.meta}>
        {payMessage}
      </div>
    </>
  )
}

export function CustomerPaymentsPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.payments.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro title="Payments" description="Your payment history with MUCO LABS." />
      {items.length === 0 ? (
        <EmptyState title="No payments yet" description="Completed payments will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((pay) => (
            <li key={String(pay.id)} className={`surface ${ui.dataCard}`}>
              <span>
                {formatMoney(String(pay.amount), String(pay.currency ?? 'INR'))}
              </span>
              <StatusPill status={String(pay.status)} tone={paymentStatusTone(String(pay.status))} />
              {pay.reference ? <span className={ui.meta}>{String(pay.reference)}</span> : null}
              {pay.proposalReference ? (
                <span className={ui.meta}>Proposal {String(pay.proposalReference)}</span>
              ) : null}
              {pay.projectReference ? (
                <span className={ui.meta}>Project {String(pay.projectReference)}</span>
              ) : null}
              <time className={ui.meta} dateTime={String(pay.createdAt)}>
                {new Date(String(pay.createdAt)).toLocaleString()}
              </time>
              {pay.paidAt ? (
                <time className={ui.meta} dateTime={String(pay.paidAt)}>
                  Paid {new Date(String(pay.paidAt)).toLocaleString()}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CustomerFilesPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.files.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  async function download(fileId: string) {
    const result = (await customerApi.files.download(fileId)) as {
      configured?: boolean
      url?: string
      message?: string
    }
    if (result.configured && result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } else {
      alert(result.message ?? 'Download is not available.')
    }
  }

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro title="Files" description="Shared documents, deliverables, and uploads." />
      {items.length === 0 ? (
        <EmptyState title="No files" description="Project documents shared with you will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((file) => (
            <li key={String(file.id)} className={`surface ${ui.dataCard}`}>
              <button type="button" className="link-underline" onClick={() => void download(String(file.id))}>
                {String(file.fileName)}
              </button>
              <span className={ui.meta}>{String(file.category ?? 'file')}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CustomerMessagesPage() {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const { data, error, loading, reload } = useFetch(() => customerApi.conversations.list(), [])
  const items = data?.items ?? []

  async function startGeneral() {
    setStarting(true)
    try {
      const row = await customerApi.conversations.create({ subject: 'General enquiry' })
      navigate(customerPortalPaths.conversationDetail(row.id))
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro
        title="Messages"
        description="Conversation history with MUCO Labs about your projects, requests, and proposals."
      />
      <p style={{ marginBottom: 'var(--space-4)' }}>
        <Button type="button" variant="secondary" disabled={starting} onClick={() => void startGeneral()}>
          {starting ? 'Opening…' : 'New general message'}
        </Button>
      </p>
      {items.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Start a conversation or wait for your team to reach out."
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((row: CustomerConversationListItem) => (
            <li key={row.id} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={customerPortalPaths.conversationDetail(row.id)}>
                {row.subject}
                {row.unreadCount > 0 ? (
                  <span className={ui.meta} aria-label={`${row.unreadCount} unread`}>
                    {' '}
                    · Unread ({row.unreadCount})
                  </span>
                ) : null}
              </Link>
              <p className={ui.meta}>{row.contextLabel}</p>
              {row.latestMessage ? (
                <p className={ui.meta}>
                  {row.latestMessage.body.slice(0, 120)}
                  {row.latestMessage.body.length > 120 ? '…' : ''}
                </p>
              ) : null}
              <time className={ui.meta} dateTime={row.updatedAt}>
                {new Date(row.updatedAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CustomerConversationDetailPage() {
  const { conversationId = '' } = useParams()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const { data, error, loading, reload } = useFetch(
    () => customerApi.conversations.get(conversationId),
    [conversationId],
  )

  useEffect(() => {
    if (!conversationId) return
    void customerApi.conversations.markRead(conversationId)
  }, [conversationId])

  const conversation = data?.conversation
  const messages = data?.messages ?? []
  const closed = conversation?.status === 'closed'

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    if (!body.trim() || sending || closed) return
    setSending(true)
    setSendError(null)
    try {
      await customerApi.conversations.sendMessage(conversationId, body)
      setBody('')
      reload()
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'Could not send message.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />
  if (!conversation) return null

  return (
    <>
      <PageIntro
        title={conversation.subject}
        description={`${conversation.contextLabel} · ${conversation.statusLabel}`}
      />
      <p className={ui.meta}>
        <Link className="link-underline" to={customerPortalPaths.messages}>
          All messages
        </Link>
      </p>
      <div
        className={ui.messageList}
        style={{ marginTop: 'var(--space-6)' }}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <EmptyState title="No messages yet" description="Send the first message below." />
        ) : (
          messages.map((m: CustomerConversationMessage) => (
            <PortalMessageArticle
              key={m.id}
              id={m.id}
              senderLabel={m.senderLabel}
              body={m.body}
              createdAt={m.createdAt}
              unread={!m.read && m.senderType === 'team'}
            />
          ))
        )}
      </div>
      {closed ? (
        <p className={ui.meta} role="status" style={{ marginTop: 'var(--space-4)' }}>
          This conversation is closed. Contact support if you need further help.
        </p>
      ) : (
        <form className={ui.form} onSubmit={(e) => void sendMessage(e)} style={{ marginTop: 'var(--space-6)' }}>
          <div className={ui.field}>
            <label htmlFor="conversation-body">Your message</label>
            <textarea
              id="conversation-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              disabled={sending}
            />
          </div>
          {sendError ? (
            <p role="alert" className={ui.meta}>
              {sendError}
            </p>
          ) : null}
          <Button type="submit" disabled={sending} aria-busy={sending}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </form>
      )}
    </>
  )
}

export function CustomerSupportPage() {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const { data, error, loading, reload } = useFetch(() => customerApi.support.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  async function createTicket(e: FormEvent) {
    e.preventDefault()
    await customerApi.support.create({ subject, description })
    setSubject('')
    setDescription('')
    reload()
  }

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro title="Support" description="Create and track support requests." />
      <form className={ui.form} onSubmit={(e) => void createTicket(e)}>
        <div className={ui.field}>
          <label htmlFor="ticket-subject">Subject</label>
          <input id="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className={ui.field}>
          <label htmlFor="ticket-desc">Description</label>
          <textarea id="ticket-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <Button type="submit">Create ticket</Button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="No support tickets" description="You don't have any open support requests." />
      ) : (
        <ul className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
          {items.map((t) => (
            <li key={String(t.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={customerPortalPaths.supportDetail(String(t.id))}>
                {String(t.subject)}
              </Link>
              <StatusPill status={String(t.status)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CustomerSupportDetailPage() {
  const { id = '' } = useParams()
  const [reply, setReply] = useState('')
  const { data, error, loading, reload } = useFetch(() => customerApi.support.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const ticket = data.ticket as Record<string, unknown>
  const replies = (data.replies as Array<Record<string, unknown>>) ?? []

  async function sendReply(e: FormEvent) {
    e.preventDefault()
    await customerApi.support.reply(id, reply)
    setReply('')
    reload()
  }

  return (
    <>
      <PageIntro title={String(ticket.subject)} />
      <p>{String(ticket.description)}</p>
      <StatusPill status={String(ticket.status)} />
      <ul className={ui.messageList} style={{ marginTop: 'var(--space-4)' }}>
        {replies.map((r) => (
          <li key={String(r.id)} className={ui.messageItem}>
            <p>{String(r.body)}</p>
            <time dateTime={String(r.createdAt)}>{new Date(String(r.createdAt)).toLocaleString()}</time>
          </li>
        ))}
      </ul>
      <form className={ui.form} onSubmit={(e) => void sendReply(e)}>
        <div className={ui.field}>
          <label htmlFor="reply">Reply</label>
          <textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} required />
        </div>
        <Button type="submit">Send reply</Button>
      </form>
    </>
  )
}

export function CustomerNotificationsPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.notifications.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []
  const notifications: PortalNotificationItem[] = items.map((n) => ({
    id: String(n.id),
    type: String(n.type ?? ''),
    title: String(n.title ?? ''),
    message: String(n.message ?? ''),
    read: Boolean(n.read),
    createdAt: String(n.createdAt ?? ''),
  }))

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro title="Notifications" description="Updates about your projects, proposals, and messages." />
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="Updates will appear here when available." />
      ) : (
        <PortalNotificationList
          portal="customer"
          items={notifications}
          onMarkRead={async (id) => {
            await customerApi.notifications.markRead(id)
            reload()
          }}
        />
      )}
    </>
  )
}

export function CustomerProfilePage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.profile.get(), [])
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [billingAddress, setBillingAddress] = useState('')

  useEffect(() => {
    if (!data) return
    setFullName(String(data.fullName ?? ''))
    setCompanyName(String(data.companyName ?? ''))
    setPhone(String(data.phone ?? ''))
    setJobTitle(String(data.jobTitle ?? ''))
    setBillingAddress(String(data.billingAddress ?? ''))
  }, [data])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  async function save(e: FormEvent) {
    e.preventDefault()
    await customerApi.profile.update({ fullName, companyName, phone, jobTitle, billingAddress })
    reload()
  }

  return (
    <>
      <PageIntro title="Profile" description="Update your contact and billing details." />
      <p className={ui.meta}>Email: {String(data?.email)} (managed through your account sign-in)</p>
      <form className={ui.form} onSubmit={(e) => void save(e)}>
        <div className={ui.field}>
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className={ui.field}>
          <label htmlFor="companyName">Company</label>
          <input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className={ui.field}>
          <label htmlFor="jobTitle">Job title</label>
          <input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
        <div className={ui.field}>
          <label htmlFor="phone">Phone</label>
          <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className={ui.field}>
          <label htmlFor="billingAddress">Billing address</label>
          <textarea
            id="billingAddress"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
          />
        </div>
        <Button type="submit">Save profile</Button>
      </form>
    </>
  )
}

export function CustomerSettingsPage() {
  const { profile } = useAuth()
  return (
    <>
      <PageIntro title="Settings" description="Account security and session." />
      <div className={`surface ${ui.dataCard}`}>
        <p className={ui.meta}>Signed in as {profile?.email}</p>
        <p className={ui.meta}>Roles: {profile?.roles?.join(', ') ?? '—'}</p>
        <Link className="link-underline" to="/auth/forgot-password">
          Change password via email reset
        </Link>
      </div>
    </>
  )
}

type ProjectRequestRow = {
  id: string
  status: string
  serviceInterest: string | null
  budget: string | null
  timeline: string | null
  createdAt: string
  updatedAt?: string
  summary: string
}

function friendlyRequestError(message: string): string {
  if (/unauthorized|401/i.test(message)) return 'Please sign in again to continue.'
  if (/not found|404/i.test(message)) return 'This project request could not be found.'
  return 'Something went wrong loading your request. Please try again.'
}

export function CustomerProjectRequestsPage() {
  const { data, error, loading, reload } = useFetch(
    () => customerApi.projectRequests.list(),
    [],
  )

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyRequestError(error)} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <PageIntro
        title="Project requests"
        description="Track what you submitted through Start Your Project. Quotes and delivery live under Projects when available."
      />
      {items.length === 0 ? (
        <EmptyState
          title="No project requests yet"
          description="You haven't submitted a project request yet."
          action={
            <Button to={customerPortalPaths.startProject}>Start Your Project</Button>
          }
        />
      ) : (
        <>
          <p className={ui.meta}>
            <Link className="link-underline" to={customerPortalPaths.startProject}>
              Start another project
            </Link>
          </p>
          <ul className={ui.stack}>
            {items.map((row: ProjectRequestRow) => (
              <li key={row.id}>
                <ProjectRequestListItem row={row} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

export function CustomerProjectRequestDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(
    () => customerApi.projectRequests.get(id),
    [id],
  )

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyRequestError(error)} onRetry={reload} />
  if (!data) return null

  const status = String(data.status)
  const reference = formatProjectRequestReference(id)
  const updatedAt = data.updatedAt ? String(data.updatedAt) : String(data.createdAt)

  return (
    <>
      <header className={detailStyles.header}>
        <p className="text-label">Project request</p>
        <h1 className="text-h1">{String(data.serviceInterest ?? 'Project request')}</h1>
        <p className={ui.meta}>
          Reference {reference} · Submitted {new Date(String(data.createdAt)).toLocaleString()}
          {updatedAt !== String(data.createdAt)
            ? ` · Updated ${new Date(updatedAt).toLocaleString()}`
            : ''}
        </p>
      </header>

      <CustomerRequestStatus status={status} />

      <section className={detailStyles.section} aria-labelledby="req-requested">
        <h2 id="req-requested" className="text-h3">
          What you requested
        </h2>
        <dl className={detailStyles.dl}>
          <div>
            <dt>Service</dt>
            <dd>{String(data.serviceInterest ?? '—')}</dd>
          </div>
          {data.budget ? (
            <div>
              <dt>Budget preference</dt>
              <dd>{String(data.budget)}</dd>
            </div>
          ) : null}
          {data.timeline ? (
            <div>
              <dt>Timeline</dt>
              <dd>{String(data.timeline)}</dd>
            </div>
          ) : null}
          {data.website ? (
            <div>
              <dt>Website</dt>
              <dd>
                <a className="link-underline" href={String(data.website)} rel="noopener noreferrer">
                  {String(data.website)}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
        <h3 className={detailStyles.subhead}>Requirements</h3>
        <p className={detailStyles.requirement}>{String(data.projectDescription ?? '')}</p>
      </section>

      <section className={detailStyles.section} aria-labelledby="req-status">
        <h2 id="req-status" className="text-h3">
          Current status
        </h2>
        <ProjectRequestLifecycle status={status} />
      </section>

      <section className={`surface ${detailStyles.section}`} aria-labelledby="req-next">
        <h2 id="req-next" className="text-h3">
          Next step
        </h2>
        <p>{projectRequestNextAction(status)}</p>
        <p className={ui.meta}>
          Quotes and payments appear here when available for your account. Use Messages to ask
          questions about this request.
        </p>
      </section>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <CustomerMessageMucoButton heading="Have a question about this request?" leadId={id} />
      </div>

      <p style={{ marginTop: 'var(--space-4)' }}>
        <Link className="link-underline" to={customerPortalPaths.requests}>
          Back to project requests
        </Link>
      </p>
    </>
  )
}
