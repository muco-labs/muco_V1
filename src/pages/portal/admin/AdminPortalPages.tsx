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
import layout from '@/layouts/EmployeeAppLayout.module.css'
import { adminPortalPaths, leadStatusOptions } from '@/config/admin-portal'
import { useAuth } from '@/contexts/AuthProvider'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'

function formatInr(amount: string) {
  const n = Number.parseFloat(amount)
  if (Number.isNaN(n)) return `₹${amount}`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
}

function asRecords(data: { items?: unknown[] } | null | undefined) {
  return (data?.items as Array<Record<string, unknown>>) ?? []
}

export function AdminLeadsPage() {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(
    () => adminApi.leads.list({ status: status || undefined, q: q || undefined }),
    [status, q],
  )
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Leads" description="Inbound and manually created opportunities." />
      <div className={layout.filterRow}>
        <input
          type="search"
          placeholder="Search leads"
          aria-label="Search leads"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {leadStatusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No new leads." description="Leads from the website or admin entry will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((lead) => (
            <li key={String(lead.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={adminPortalPaths.leadDetail(String(lead.id))}>
                {String(lead.name)}
              </Link>
              <span className={ui.meta}>{String(lead.email)}</span>
              <StatusPill status={String(lead.status)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminLeadDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => adminApi.leads.get(id), [id])
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (data?.status) setStatus(String(data.status))
    if (data?.notes != null) setNotes(String(data.notes))
  }, [data])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  async function save() {
    try {
      await adminApi.leads.update(id, { status, notes })
      reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  return (
    <>
      <PageIntro title={String(data.name)} description={String(data.company ?? data.email)} />
      <StatusPill status={String(data.status)} />
      <p className={ui.meta}>Source: {String(data.source ?? '—')}</p>
      <p>{String(data.projectDescription)}</p>
      <div className={ui.form} style={{ marginTop: 'var(--space-4)' }}>
        <div className={ui.field}>
          <label htmlFor="lead-status">Status</label>
          <select id="lead-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {leadStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className={ui.field}>
          <label htmlFor="lead-notes">Notes</label>
          <textarea id="lead-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="button" onClick={() => void save()}>
          Save changes
        </Button>
      </div>
    </>
  )
}

export function AdminCustomersPage() {
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(() => adminApi.customers.list(q || undefined), [q])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Customers" description="Customer accounts and profiles." />
      <div className={layout.filterRow}>
        <input
          type="search"
          placeholder="Search customers"
          aria-label="Search customers"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {items.length === 0 ? (
        <EmptyState title="No customers yet" description="Customer profiles appear after registration or invite." />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => {
            const profile = row.profile as Record<string, unknown>
            const user = row.user as Record<string, unknown>
            return (
              <li key={String(profile.id)} className={`surface ${ui.dataCard}`}>
                <Link className="link-underline" to={adminPortalPaths.customerDetail(String(profile.id))}>
                  {String(user.fullName ?? user.email)}
                </Link>
                <span className={ui.meta}>{String(profile.companyName ?? user.email)}</span>
                <StatusPill status={String(user.status)} />
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export function AdminCustomerDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => adminApi.customers.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const user = data.user as Record<string, unknown>
  const profile = data.profile as Record<string, unknown>
  const projects = (data.projects as Array<Record<string, unknown>>) ?? []
  const invoices = (data.invoices as Array<Record<string, unknown>>) ?? []

  return (
    <>
      <PageIntro
        title={String(user.fullName ?? user.email)}
        description={String(profile.companyName ?? 'Customer')}
      />
      <p className={ui.meta}>Email: {String(user.email)}</p>
      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h3">Projects</h2>
        {projects.length === 0 ? (
          <EmptyState title="No active projects." description="Projects for this customer will appear here." />
        ) : (
          <ul className={ui.stack}>
            {projects.map((p) => (
              <li key={String(p.id)}>
                {String(p.name)} <StatusPill status={String(p.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Invoices</h2>
        {invoices.length === 0 ? (
          <EmptyState title="No invoices" description="Issued invoices will appear here." />
        ) : (
          <ul className={ui.stack}>
            {invoices.map((inv) => (
              <li key={String(inv.id)} className={ui.meta}>
                {String(inv.invoiceNumber)} · {formatInr(String(inv.amount))}{' '}
                <StatusPill status={String(inv.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export function AdminEmployeesPage() {
  const { profile } = useAuth()
  const canInvite = profile?.permissions.includes('employees.create')
  const canDisable = profile?.permissions.includes('users.disable')
  const { data, error, loading, reload } = useFetch(() => adminApi.employees.list(), [])
  const items = asRecords(data)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  async function onInvite(e: FormEvent) {
    e.preventDefault()
    setInviteMsg(null)
    try {
      await adminApi.employees.invite({ email, fullName })
      setInviteMsg('Invitation sent.')
      setEmail('')
      setFullName('')
      reload()
    } catch (err) {
      setInviteMsg(err instanceof ApiError ? err.message : 'Invite failed')
    }
  }

  async function deactivate(userId: string) {
    if (!confirm('Deactivate this employee? They will not be able to sign in.')) return
    try {
      await adminApi.employees.setStatus(userId, 'disabled')
      reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  return (
    <>
      <PageIntro title="Employees" description="Team access and invitations." />
      {canInvite ? (
        <form className={`surface ${ui.dataCard}`} onSubmit={(e) => void onInvite(e)}>
          <h2 className="text-h3">Invite employee</h2>
          <div className={ui.form}>
            <div className={ui.field}>
              <label htmlFor="emp-email">Email</label>
              <input id="emp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className={ui.field}>
              <label htmlFor="emp-name">Full name</label>
              <input id="emp-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <Button type="submit">Send invitation</Button>
            {inviteMsg ? <p className={ui.meta}>{inviteMsg}</p> : null}
          </div>
        </form>
      ) : null}
      {items.length === 0 ? (
        <EmptyState title="No employees" description="Invite your first team member to get started." />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => {
            const user = row.user as Record<string, unknown>
            const emp = row.profile as Record<string, unknown>
            return (
              <li key={String(emp.id)} className={`surface ${ui.dataCard}`}>
                <strong>{String(user.fullName ?? user.email)}</strong>
                <span className={ui.meta}>{String(user.email)}</span>
                <StatusPill status={String(user.status)} />
                {canDisable && user.status === 'active' ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => void deactivate(String(user.id))}>
                    Deactivate
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export function AdminProjectsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.projects.list(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Projects" description="Customer engagements and delivery status." />
      {items.length === 0 ? (
        <EmptyState title="No active projects." description="Create a project from the admin API or this UI when enabled." />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => {
            const project = row.project as Record<string, unknown>
            return (
              <li key={String(project.id)} className={`surface ${ui.dataCard}`}>
                <strong>{String(project.name)}</strong>
                <span className={ui.meta}>{String(row.companyName ?? '')}</span>
                <StatusPill status={String(project.status)} />
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export function AdminTasksPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.tasks.list(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Tasks" description="Work items across projects." />
      {items.length === 0 ? (
        <EmptyState title="No tasks" description="Tasks assigned to the team will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((task) => (
            <li key={String(task.id)} className={`surface ${ui.dataCard}`}>
              {String(task.title)}
              <StatusPill status={String(task.status)} />
              {task.dueDate ? (
                <time className={ui.meta} dateTime={String(task.dueDate)}>
                  Due {new Date(String(task.dueDate)).toLocaleDateString()}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminProposalsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.proposals.list(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Proposals" description="Draft and sent proposals awaiting customer action." />
      {items.length === 0 ? (
        <EmptyState title="No proposals" description="Create a proposal when you are ready to send scope to a customer." />
      ) : (
        <ul className={ui.stack}>
          {items.map((p) => (
            <li key={String(p.id)} className={`surface ${ui.dataCard}`}>
              {String(p.title ?? 'Proposal')}
              {p.amount ? <span className={ui.meta}>{formatInr(String(p.amount))}</span> : null}
              <StatusPill status={String(p.status)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminInvoicesPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.invoices.list(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  const items = asRecords(data)

  return (
    <>
      <PageIntro title="Invoices" description="Billing documents and collection status." />
      {items.length === 0 ? (
        <EmptyState title="No invoices" description="₹0 outstanding until invoices are issued." />
      ) : (
        <ul className={ui.stack}>
          {items.map((inv) => (
            <li key={String(inv.id)} className={`surface ${ui.dataCard}`}>
              {String(inv.invoiceNumber)} · {formatInr(String(inv.amount))}
              <StatusPill status={String(inv.status)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminPaymentsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.payments.list(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Payments" description="Verified payment records from Razorpay webhooks and server confirmation." />
      {items.length === 0 ? (
        <EmptyState title="No payments recorded" description="Successful payments will appear after server verification." />
      ) : (
        <ul className={ui.stack}>
          {items.map((pay) => (
            <li key={String(pay.id)} className={`surface ${ui.dataCard}`}>
              {formatInr(String(pay.amount))}
              <StatusPill status={String(pay.status)} />
              <span className={ui.meta}>{new Date(String(pay.createdAt)).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminFilesPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.files.list(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Files" description="Project and company files (authorized access only)." />
      {items.length === 0 ? (
        <EmptyState title="No files" description="Uploaded project files will be listed here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((f) => (
            <li key={String(f.id)} className={`surface ${ui.dataCard}`}>
              {String(f.fileName ?? 'File')}
              <span className={ui.meta}>Project {String(f.projectId ?? '—')}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminMessagesPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.messages.list(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Messages" description="Project communication (permission-scoped)." />
      {items.length === 0 ? (
        <EmptyState title="No messages" description="Project messages will appear when teams and customers communicate." />
      ) : (
        <ul className={ui.stack}>
          {items.map((m) => (
            <li key={String(m.id)} className={`surface ${ui.dataCard}`}>
              <p>{String(m.body)}</p>
              <span className={ui.meta}>{new Date(String(m.createdAt)).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminSupportPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.support.list(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Support" description="Customer support queue." />
      {items.length === 0 ? (
        <EmptyState title="No open tickets" description="Support requests from customers will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((t) => (
            <li key={String(t.id)} className={`surface ${ui.dataCard}`}>
              <strong>{String(t.subject)}</strong>
              <StatusPill status={String(t.status)} />
              <StatusPill status={String(t.priority)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminAnalyticsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.analytics(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const sections = ['leadByStatus', 'projectByStatus', 'invoiceByStatus'] as const

  return (
    <>
      <PageIntro title="Analytics" description="Aggregates from live data — no decorative charts without values." />
      {sections.map((key) => {
        const rows = (data[key] as Array<{ status: string; c: number }>) ?? []
        return (
          <section key={key} style={{ marginBottom: 'var(--space-6)' }}>
            <h2 className="text-h3">{key}</h2>
            {rows.length === 0 ? (
              <p className={ui.meta}>Insufficient data.</p>
            ) : (
              <ul className={ui.stack}>
                {rows.map((row) => (
                  <li key={row.status} className={ui.meta}>
                    {row.status}: {row.c}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </>
  )
}

export function AdminNotificationsPage() {
  return (
    <>
      <PageIntro
        title="Notifications"
        description="Operational alerts will surface here when notification delivery is configured."
      />
      <EmptyState title="No notifications" description="Check the dashboard and audit log for recent activity." />
    </>
  )
}

export function AdminAuditLogsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.auditLogs(), [])
  const items = asRecords(data)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Audit logs" description="Administrative actions (no secrets or credentials logged)." />
      {items.length === 0 ? (
        <EmptyState title="No events" description="Important admin actions will be recorded here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => (
            <li key={String(row.id)} className={`surface ${ui.dataCard}`}>
              <span className={ui.meta}>{new Date(String(row.createdAt)).toLocaleString()}</span>
              <strong>{String(row.action)}</strong>
              <span className={ui.meta}>
                {String(row.entity)} {row.entityId ? `· ${String(row.entityId)}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminSettingsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.integrations(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  const supabase = (data?.supabase as { configured?: boolean }) ?? {}
  const database = (data?.database as { configured?: boolean }) ?? {}
  const razorpay = (data?.razorpay as { configured?: boolean }) ?? {}

  function statusLabel(configured?: boolean) {
    return configured ? 'Configured' : 'Not configured'
  }

  return (
    <>
      <PageIntro title="Settings" description="Company and integration status (secrets stay on the server)." />
      <article className={`surface ${ui.dataCard}`}>
        <h2 className="text-h3">Integrations</h2>
        <ul className={ui.stack}>
          <li>Supabase: {statusLabel(supabase.configured)}</li>
          <li>Database: {statusLabel(database.configured)}</li>
          <li>Razorpay: {statusLabel(razorpay.configured)}</li>
        </ul>
        <p className={ui.meta}>{String(data?.note ?? '')}</p>
      </article>
    </>
  )
}

export function AdminSecurityPage() {
  const { profile } = useAuth()
  const { data, error, loading, reload } = useFetch(() => adminApi.integrations(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Security" description="Account and session overview without exposing tokens." />
      <article className={`surface ${ui.dataCard}`}>
        <h2 className="text-h3">Signed-in account</h2>
        <p>{profile?.email}</p>
        <p className={ui.meta}>Roles: {profile?.roles.join(', ')}</p>
        <p className={ui.meta}>Permissions: {profile?.permissions.length} granted</p>
      </article>
      <article className={`surface ${ui.dataCard}`} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Infrastructure</h2>
        <p className={ui.meta}>
          API keys and webhook secrets are never shown in the browser. {String(data?.note ?? '')}
        </p>
      </article>
    </>
  )
}
