import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PageIntro,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { customerPortalPaths } from '@/config/customer-portal'
import { useAuth } from '@/contexts/AuthProvider'
import { useFetch } from '@/hooks/useFetch'
import { customerApi } from '@/services/customer-portal'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'

type ProjectRow = {
  id: string
  name: string
  status: string
  startDate?: string | null
  expectedCompletion?: string | null
  progressPercent: number | null
}

export function CustomerProjectsPage() {
  const { data, error, loading, reload } = useFetch(
    () => customerApi.projects.list() as Promise<{ items: ProjectRow[] }>,
    [],
  )

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <PageIntro title="Projects" description="Track status, milestones, and deliverables." />
      {items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="No projects have been assigned to your account yet."
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((project) => (
            <li key={project.id} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={customerPortalPaths.projectDetail(project.id)}>
                <h2 className="text-h3">{project.name}</h2>
              </Link>
              <StatusPill status={project.status} />
              {project.progressPercent != null ? (
                <div className={ui.progressBar} aria-label={`Progress ${project.progressPercent}%`}>
                  <span style={{ width: `${project.progressPercent}%` }} />
                </div>
              ) : (
                <p className={ui.meta}>Progress will appear when milestones are added.</p>
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
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const project = data.project as Record<string, unknown>
  const milestones = (data.milestones as Array<Record<string, unknown>>) ?? []
  const tasks = (data.tasks as Array<Record<string, unknown>>) ?? []
  const progressPercent = data.progressPercent as number | null

  return (
    <>
      <PageIntro
        label="Project"
        title={String(project.name ?? 'Project')}
        description={project.description ? String(project.description) : undefined}
      />
      <StatusPill status={String(project.status)} />
      {progressPercent != null ? (
        <div className={ui.progressBar} style={{ marginTop: 'var(--space-3)' }}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      ) : null}

      <section style={{ marginTop: 'var(--space-8)' }}>
        <h2 className="text-h3">Milestones</h2>
        {milestones.length === 0 ? (
          <EmptyState title="No milestones yet" description="Your project timeline will appear here." />
        ) : (
          <ol className={ui.timeline}>
            {milestones.map((m) => (
              <li key={String(m.id)}>
                <strong>{String(m.name)}</strong>
                <StatusPill status={String(m.status)} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h3">Task status</h2>
        {tasks.length === 0 ? (
          <p className={ui.meta}>No customer-visible tasks yet.</p>
        ) : (
          <ul className={ui.stack}>
            {tasks.map((t) => (
              <li key={String(t.id)} className={ui.meta}>
                {String(t.title)} — <StatusPill status={String(t.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export function CustomerProposalsPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.proposals.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Proposals" description="Review scope, pricing, and approve when ready." />
      {items.length === 0 ? (
        <EmptyState title="No proposals" description="Sent proposals will appear here for your review." />
      ) : (
        <ul className={ui.stack}>
          {items.map((p) => (
            <li key={String(p.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={customerPortalPaths.proposalDetail(String(p.id))}>
                {String(p.title ?? 'Proposal')}
              </Link>
              <StatusPill status={String(p.status)} />
              {p.amount ? <span className={ui.meta}>₹{String(p.amount)}</span> : null}
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
  const { data, error, loading, reload } = useFetch(() => customerApi.proposals.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const canDecide = ['sent', 'viewed', 'changes_requested'].includes(String(data.status))

  async function decide(action: 'approve' | 'requestChanges' | 'reject') {
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
      <PageIntro title={String(data.title ?? 'Proposal')} />
      <StatusPill status={String(data.status)} />
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
        {data.amount ? <p className={ui.meta}>Total: ₹{String(data.amount)}</p> : null}
        {data.discountAmount ? (
          <p className={ui.meta}>Includes authorized discount: ₹{String(data.discountAmount)}</p>
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
              Approve
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
    </>
  )
}

export function CustomerInvoicesPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.invoices.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

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
  const { data, error, loading, reload } = useFetch(() => customerApi.invoices.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const invoice = data.invoice as Record<string, unknown>
  const lines = (data.lineItems as Array<Record<string, unknown>>) ?? []

  async function handlePay() {
    setPayMessage(null)
    try {
      const intent = (await customerApi.invoices.pay(id)) as {
        razorpay?: { configured: boolean; message?: string; keyId?: string; orderId?: string }
      }
      if (!intent.razorpay?.configured) {
        setPayMessage(intent.razorpay?.message ?? 'Online payments are not configured yet.')
        return
      }
      setPayMessage(
        'Razorpay checkout is ready on the server. Complete payment in the hosted flow once the checkout script is enabled for your environment.',
      )
    } catch (err) {
      setPayMessage(err instanceof ApiError ? err.message : 'Payment could not be started.')
    }
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
          <Button type="button" onClick={() => void handlePay()}>
            Pay now
          </Button>
        </div>
      ) : null}
      {payMessage ? <p className={ui.meta}>{payMessage}</p> : null}
    </>
  )
}

export function CustomerPaymentsPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.payments.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Payments" description="Your payment history with MUCO LABS." />
      {items.length === 0 ? (
        <EmptyState title="No payments yet" description="Completed payments will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((pay) => (
            <li key={String(pay.id)} className={`surface ${ui.dataCard}`}>
              <span>₹{String(pay.amount)}</span>
              <StatusPill status={String(pay.status)} />
              <time className={ui.meta} dateTime={String(pay.createdAt)}>
                {new Date(String(pay.createdAt)).toLocaleString()}
              </time>
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
  if (error) return <PortalError message={error} onRetry={reload} />

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
  const [body, setBody] = useState('')
  const { data, error, loading, reload } = useFetch(() => customerApi.messages.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    await customerApi.messages.send({ body })
    setBody('')
    reload()
  }

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Messages" description="Communicate with MUCO LABS about your work." />
      <form className={ui.form} onSubmit={(e) => void sendMessage(e)}>
        <div className={ui.field}>
          <label htmlFor="message-body">New message</label>
          <textarea id="message-body" value={body} onChange={(e) => setBody(e.target.value)} required />
        </div>
        <Button type="submit">Send</Button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="No messages yet" description="No messages yet." />
      ) : (
        <div className={ui.messageList} style={{ marginTop: 'var(--space-6)' }}>
          {items.map((m) => (
            <article key={String(m.id)} className={ui.messageItem}>
              <p>{String(m.body)}</p>
              <time dateTime={String(m.createdAt)}>{new Date(String(m.createdAt)).toLocaleString()}</time>
            </article>
          ))}
        </div>
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
  if (error) return <PortalError message={error} onRetry={reload} />

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
  if (error) return <PortalError message={error} onRetry={reload} />
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

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Notifications" />
      {items.length === 0 ? (
        <EmptyState title="No notifications" description="Updates will appear here when available." />
      ) : (
        <ul className={ui.stack}>
          {items.map((n) => (
            <li key={String(n.id)} className={`surface ${ui.dataCard}`}>
              <strong>{String(n.title)}</strong>
              <p className={ui.meta}>{String(n.message)}</p>
              {!n.read ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void customerApi.notifications.markRead(String(n.id)).then(reload)}
                >
                  Mark read
                </Button>
              ) : (
                <span className={ui.meta}>Read</span>
              )}
            </li>
          ))}
        </ul>
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
  if (error) return <PortalError message={error} onRetry={reload} />

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
  summary: string
}

export function CustomerProjectRequestsPage() {
  const { data, error, loading, reload } = useFetch(
    () => customerApi.projectRequests.list(),
    [],
  )

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <PageIntro
        title="Project requests"
        description="Submissions from the Start Project flow. Quotes and active projects appear separately when available."
      />
      <p className={ui.meta}>
        <Link className="link-underline" to={customerPortalPaths.startProject}>
          Start a new project request
        </Link>
      </p>
      {items.length === 0 ? (
        <EmptyState
          title="No project requests yet"
          description="Use Start a project to tell us what you need."
          action={
            <Button to={customerPortalPaths.startProject}>Start a project</Button>
          }
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((row: ProjectRequestRow) => (
            <li key={row.id} className={`surface ${ui.dataCard}`}>
              <Link
                className="link-underline"
                to={customerPortalPaths.projectRequestDetail(row.id)}
              >
                <h2 className="text-h3">{row.serviceInterest ?? 'Project request'}</h2>
              </Link>
              <StatusPill status={row.status} />
              <p className={ui.meta}>
                {new Date(row.createdAt).toLocaleString()}
                {row.budget ? ` · ${row.budget}` : ''}
                {row.timeline ? ` · ${row.timeline}` : ''}
              </p>
              <p>{row.summary}{row.summary.length >= 160 ? '…' : ''}</p>
            </li>
          ))}
        </ul>
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
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  return (
    <>
      <PageIntro
        label="Project request"
        title={String(data.serviceInterest ?? 'Request')}
        description={`Submitted ${new Date(String(data.createdAt)).toLocaleString()}`}
      />
      <StatusPill status={String(data.status)} />
      <div className={`surface ${ui.dataCard}`} style={{ marginTop: 'var(--space-6)' }}>
        <p className={ui.meta}>
          {String(data.name)}
          {' · '}
          {String(data.email)}
          {data.phone ? ` · ${String(data.phone)}` : ''}
        </p>
        {data.budget ? <p className={ui.meta}>Budget: {String(data.budget)}</p> : null}
        {data.timeline ? <p className={ui.meta}>Timeline: {String(data.timeline)}</p> : null}
        {data.website ? (
          <p className={ui.meta}>
            Website:{' '}
            <a className="link-underline" href={String(data.website)} rel="noopener noreferrer">
              {String(data.website)}
            </a>
          </p>
        ) : null}
        <h2 className="text-h3" style={{ marginTop: 'var(--space-4)' }}>
          Requirements
        </h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{String(data.projectDescription ?? '')}</p>
      </div>
      <p style={{ marginTop: 'var(--space-4)' }}>
        <Link className="link-underline" to={customerPortalPaths.requests}>
          Back to project requests
        </Link>
      </p>
    </>
  )
}
