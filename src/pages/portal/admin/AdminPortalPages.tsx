import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
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
import { mucoDepartments } from '@/config/org'
import { useAuth } from '@/contexts/AuthProvider'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'
import { CrmEntryChannelBadge } from '@/components/portal/crm/CrmStartProjectLeadPanel'

function formatInr(amount: string) {
  const n = Number.parseFloat(amount)
  if (Number.isNaN(n)) return `₹${amount}`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
}

function asRecords(data: { items?: unknown[] } | null | undefined) {
  return (data?.items as Array<Record<string, unknown>>) ?? []
}

export function AdminLeadsPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [locality, setLocality] = useState<'' | 'erode' | 'tamil_nadu' | 'india' | 'international'>(() => {
    const v = searchParams.get('locality')
    return v === 'erode' || v === 'tamil_nadu' || v === 'india' || v === 'international' ? v : ''
  })
  const [market, setMarket] = useState<'' | 'us' | 'uk' | 'ca' | 'au' | 'ae' | 'sg'>(() => {
    const v = searchParams.get('market')
    return v === 'us' || v === 'uk' || v === 'ca' || v === 'au' || v === 'ae' || v === 'sg' ? v : ''
  })
  const [channel, setChannel] = useState<'' | 'start_project' | 'contact' | 'other'>('')
  const [followUp, setFollowUp] = useState<'' | 'overdue' | 'today' | 'upcoming' | 'none'>(() => {
    const v = searchParams.get('followUp')
    return v === 'overdue' || v === 'today' || v === 'upcoming' || v === 'none' ? v : ''
  })
  const { data, error, loading, reload } = useFetch(
    () =>
      adminApi.leads.list({
        status: status || undefined,
        q: q || undefined,
        channel: channel || undefined,
        followUp: followUp || undefined,
        locality: locality || undefined,
        market: market || undefined,
      }),
    [status, q, channel, followUp, locality, market],
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
        <select
          aria-label="Filter by follow-up"
          value={followUp}
          onChange={(e) =>
            setFollowUp(e.target.value as '' | 'overdue' | 'today' | 'upcoming' | 'none')
          }
        >
          <option value="">All follow-ups</option>
          <option value="today">Due today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
          <option value="none">No follow-up</option>
        </select>
        <select
          aria-label="Filter by entry channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value as '' | 'start_project' | 'contact' | 'other')}
        >
          <option value="">All channels</option>
          <option value="start_project">Start Project</option>
          <option value="contact">Contact</option>
          <option value="other">Other</option>
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {leadStatusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by location segment"
          value={locality}
          onChange={(e) => setLocality(e.target.value as '' | 'erode' | 'tamil_nadu' | 'india' | 'international')}
        >
          <option value="">All locations</option>
          <option value="erode">Erode segment</option>
          <option value="tamil_nadu">Tamil Nadu</option>
          <option value="india">India (national segment)</option>
          <option value="international">International</option>
        </select>
        <select
          aria-label="Filter by Tier 1 market"
          value={market}
          onChange={(e) => setMarket(e.target.value as '' | 'us' | 'uk' | 'ca' | 'au' | 'ae' | 'sg')}
          disabled={locality !== 'international'}
        >
          <option value="">All international</option>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
          <option value="ca">Canada</option>
          <option value="au">Australia</option>
          <option value="ae">UAE</option>
          <option value="sg">Singapore</option>
        </select>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No enquiries" description="No enquiries have arrived yet." />
      ) : (
        <ul className={ui.stack}>
          {items.map((lead) => (
            <li key={String(lead.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={adminPortalPaths.leadDetail(String(lead.id))}>
                {String(lead.name)}
              </Link>
              <span className={ui.meta}>{String(lead.email)}</span>
              {lead.entryChannelLabel ? (
                <CrmEntryChannelBadge label={String(lead.entryChannelLabel)} />
              ) : null}
              {lead.customerRequestReference ? (
                <span className={ui.meta}>Ref. {String(lead.customerRequestReference)}</span>
              ) : null}
              {lead.serviceInterest ? (
                <span className={ui.meta}>{String(lead.serviceInterest)}</span>
              ) : null}
              {lead.assignedName ? (
                <span className={ui.meta}>Owner: {String(lead.assignedName)}</span>
              ) : (
                <span className={ui.meta}>Unassigned</span>
              )}
              {lead.followUpLabel ? (
                <span className={ui.meta}>{String(lead.followUpLabel)}</span>
              ) : null}
              {lead.businessCity ? (
                <span className={ui.meta}>{String(lead.businessCity)}</span>
              ) : null}
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
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  async function onInvite(e: FormEvent) {
    e.preventDefault()
    setInviteMsg(null)
    try {
      await adminApi.employees.invite({
        email,
        fullName,
        department: department || undefined,
        jobTitle: jobTitle || undefined,
      })
      setInviteMsg('Invitation sent.')
      setEmail('')
      setFullName('')
      setDepartment('')
      setJobTitle('')
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
      <p className={ui.meta}>
        <Link className="link-underline" to={adminPortalPaths.teamAccess}>
          Team access review
        </Link>
      </p>
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
            <div className={ui.field}>
              <label htmlFor="emp-dept">Department</label>
              <select id="emp-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Select…</option>
                {mucoDepartments.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={ui.field}>
              <label htmlFor="emp-title">Job title</label>
              <input id="emp-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
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
                {emp.department ? (
                  <span className={ui.meta}>Dept: {String(emp.department)}</span>
                ) : null}
                {emp.employmentState ? (
                  <span className={ui.meta}>Employment: {String(emp.employmentState)}</span>
                ) : null}
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
  const [applying, setApplying] = useState<string | null>(null)
  const items = asRecords(data)

  async function applyTemplate(projectId: string, templateId: string) {
    setApplying(projectId)
    try {
      await adminApi.projects.applyTemplate(projectId, templateId)
      reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not apply template')
    } finally {
      setApplying(null)
    }
  }

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
                <div className={layout.filterRow} style={{ marginTop: 'var(--space-3)' }}>
                  <Button
                    type="button"
                    disabled={applying === String(project.id)}
                    onClick={() => void applyTemplate(String(project.id), 'website')}
                  >
                    {applying === String(project.id) ? 'Applying…' : 'Website template'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={applying === String(project.id)}
                    onClick={() => void applyTemplate(String(project.id), 'software')}
                  >
                    Software template
                  </Button>
                </div>
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

function formatInrDashboard(amount: unknown) {
  const n = Number.parseFloat(String(amount ?? '0'))
  if (Number.isNaN(n)) return `₹${String(amount ?? '0')}`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
}

export function AdminSalesPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.sales.dashboard(), [])

  if (loading) return <ListSkeleton rows={8} />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  return (
    <>
      <PageIntro
        title="Sales pipeline"
        description="Opportunities are qualified leads in CRM — real counts only, labeled pipeline (not revenue)."
      />
      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Open opportunities</h2>
          <p className="text-h2">{String(data.openOpportunities ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Pipeline value</h2>
          <p className="text-h2">
            {data.pipelineValue != null ? formatInrDashboard(data.pipelineValue) : '—'}
          </p>
          <p className={ui.meta}>Open proposals linked to active leads.</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Won revenue (proposals)</h2>
          <p className="text-h2">
            {data.wonRevenue != null ? formatInrDashboard(data.wonRevenue) : '—'}
          </p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Win rate</h2>
          <p className="text-h2">
            {data.conversionRate != null
              ? `${Math.round(Number(data.conversionRate) * 100)}%`
              : '—'}
          </p>
          {data.averageDealValueNote ? <p className={ui.meta}>{String(data.averageDealValueNote)}</p> : null}
        </article>
      </div>
      {(data.byService as Array<{ service: string; count: number }> | undefined)?.length ? (
        <section style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Demand by service</h2>
          <ul className={ui.stack}>
            {(data.byService as Array<{ service: string; count: number }>).map((row) => (
              <li key={row.service} className={`surface ${ui.dataCard}`}>
                {row.service} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {(data.lostByReason as Array<{ reason: string; count: number }> | undefined)?.length ? (
        <section style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">Lost reasons</h2>
          <ul className={ui.stack}>
            {(data.lostByReason as Array<{ reason: string; count: number }>).map((row) => (
              <li key={row.reason} className={ui.meta}>
                {row.reason.replaceAll('_', ' ')}: {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}

export function AdminRevenuePage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.sales.revenue(), [])

  if (loading) return <ListSkeleton rows={8} />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  return (
    <>
      <PageIntro
        title="Revenue"
        description="Actual collected payments and outstanding invoices — not pipeline forecasts."
      />
      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">This month</h2>
          <p className="text-h2">{formatInrDashboard(data.revenueThisMonth)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">This quarter</h2>
          <p className="text-h2">{formatInrDashboard(data.revenueThisQuarter)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">This year</h2>
          <p className="text-h2">{formatInrDashboard(data.revenueThisYear)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Outstanding</h2>
          <p className="text-h2">{formatInrDashboard(data.outstandingInvoices)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Active retainers</h2>
          <p className="text-h2">{String(data.recurringAgreementsActive ?? 0)}</p>
          <p className={ui.meta}>Tracking only — not auto-billed.</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Renewals (45 days)</h2>
          <p className="text-h2">{String(data.renewalsApproaching ?? 0)}</p>
        </article>
      </div>
    </>
  )
}

export function AdminOperationsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.operations.report(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const metrics = [
    ['Open leads', data.openLeads],
    ['Qualified leads', data.qualifiedLeads],
    ['Pending proposals', data.pendingProposals],
    ['Active projects', data.activeProjects],
    ['Projects at risk', data.projectsAtRisk],
    ['Completed projects', data.completedProjects],
    ['Overdue invoices', data.overdueInvoices],
    ['Open support tickets', data.openSupportTickets],
    ['Open tasks', data.openTasks],
    ['Tasks due (7 days)', data.tasksDueSoon],
  ] as const

  return (
    <>
      <PageIntro
        title="Operations"
        description="Cross-module reporting from verified database records."
      />
      <div className={ui.cardGrid}>
        {metrics.map(([label, value]) => (
          <article key={label} className={`surface ${ui.dataCard}`}>
            <h2 className="text-h3">{label}</h2>
            <p className="text-h2">{String(value ?? 0)}</p>
          </article>
        ))}
      </div>
      <p className={ui.meta} style={{ marginTop: 'var(--space-4)' }}>
        Outstanding invoices: ₹{String(data.outstandingInvoicesTotal ?? '0')} · Revenue (paid): ₹
        {String(data.revenueSucceeded ?? '0')}
      </p>
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
  const {
    data: autoData,
    error: autoError,
    loading: autoLoading,
    reload: reloadAuto,
  } = useFetch(() => adminApi.automationLogs(), [])
  const items = asRecords(data)
  const automationItems = asRecords(autoData)

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

      <section style={{ marginTop: 'var(--space-8)' }}>
        <h2 className="text-h3">Automation & payments</h2>
        {autoLoading ? (
          <ListSkeleton rows={4} />
        ) : autoError ? (
          <PortalError message={autoError} onRetry={reloadAuto} />
        ) : automationItems.length === 0 ? (
          <p className={ui.meta}>No automation events logged yet.</p>
        ) : (
          <ul className={ui.stack}>
            {automationItems.map((row) => (
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
      </section>
    </>
  )
}

export function AdminSettingsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.integrations(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  const supabase = (data?.supabase as { configured?: boolean }) ?? {}
  const database = (data?.database as { configured?: boolean }) ?? {}
  const razorpay = (data?.razorpay as { configured?: boolean; webhookConfigured?: boolean }) ?? {}
  const email = (data?.email as { resend?: { configured?: boolean } }) ?? {}

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
          <li>Razorpay webhook secret: {statusLabel(razorpay.webhookConfigured)}</li>
          <li>Email (Resend): {statusLabel(email.resend?.configured)}</li>
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

function formatInrNullable(amount: string | null | undefined) {
  if (amount == null || amount === '') return '—'
  return formatInr(amount)
}

export function AdminLocalMarketPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.local.erodeDashboard(), [])

  if (loading) return <ListSkeleton rows={6} />
  if (error) return <PortalError message={error} onRetry={reload} />

  const byService = (data?.byService as Array<{ service: string; count: number }>) ?? []
  const bySource = (data?.bySource as Array<{ source: string; count: number }>) ?? []
  const recent =
    (data?.recentLeads as Array<Record<string, unknown>>) ?? []

  return (
    <>
      <PageIntro
        label="Local market"
        title="Erode segment"
        description="Counts use voluntary city, /erode pages, or explicit page context—not IP geolocation."
      />
      <p className={ui.meta}>{String(data?.attributionNote ?? '')}</p>

      <div className={ui.cardGrid} style={{ marginTop: 'var(--space-4)' }}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Leads</h2>
          <p className="text-h2">{Number(data?.totalLeads ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Qualified+</h2>
          <p className="text-h2">{Number(data?.qualifiedLeads ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Won</h2>
          <p className="text-h2">{Number(data?.wonLeads ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Pipeline (proposals)</h2>
          <p className="text-h2">{formatInrNullable(data?.pipelineValue as string)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Accepted proposals</h2>
          <p className="text-h2">{formatInrNullable(data?.wonProposalValue as string)}</p>
        </article>
      </div>

      {byService.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">By service</h2>
          <ul className={ui.stack}>
            {byService.map((row) => (
              <li key={row.service} className={`surface ${ui.dataCard}`}>
                {row.service} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bySource.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">By source</h2>
          <ul className={ui.stack}>
            {bySource.map((row) => (
              <li key={row.source} className={`surface ${ui.dataCard}`}>
                {row.source} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
        <div className={layout.filterRow}>
          <h2 className="text-h3">Recent Erode-segment leads</h2>
          <Link className="link-underline" to={`${adminPortalPaths.crmLeadsList}?locality=erode`}>
            View all with filter
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No leads yet" description="Erode-segment leads will appear as enquiries arrive." />
        ) : (
          <ul className={ui.stack}>
            {recent.map((lead) => (
              <li key={String(lead.id)} className={`surface ${ui.dataCard}`}>
                <Link className="link-underline" to={adminPortalPaths.crmLeadDetail(String(lead.id))}>
                  {String(lead.name)}
                </Link>
                <span className={ui.meta}>
                  {String(lead.serviceInterest ?? 'Service TBD')}
                  {lead.businessCity ? ` · ${String(lead.businessCity)}` : ''}
                </span>
                <StatusPill status={String(lead.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

type SegmentMetrics = {
  totalLeads?: number
  qualifiedLeads?: number
  wonLeads?: number
  pipelineValue?: string | null
}

function SegmentCard({ title, segment }: { title: string; segment?: SegmentMetrics }) {
  return (
    <article className={`surface ${ui.dataCard}`}>
      <h2 className="text-h3">{title}</h2>
      <p className={ui.meta}>Leads: {Number(segment?.totalLeads ?? 0)}</p>
      <p className={ui.meta}>Qualified+: {Number(segment?.qualifiedLeads ?? 0)}</p>
      <p className={ui.meta}>Won: {Number(segment?.wonLeads ?? 0)}</p>
      <p className={ui.meta}>Pipeline: {formatInrNullable(segment?.pipelineValue)}</p>
    </article>
  )
}

export function AdminNationalMarketPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.local.indiaDashboard(), [])

  if (loading) return <ListSkeleton rows={8} />
  if (error) return <PortalError message={error} onRetry={reload} />

  const segments = (data?.segments as Record<string, SegmentMetrics>) ?? {}
  const topStates = (data?.topStates as Array<{ state: string; count: number }>) ?? []
  const topCities = (data?.topCities as Array<{ city: string; count: number }>) ?? []
  const byService = (data?.byService as Array<{ service: string; count: number }>) ?? []
  const recent = (data?.recentLeads as Array<Record<string, unknown>>) ?? []

  return (
    <>
      <PageIntro
        label="National market"
        title="India segment"
        description="Erode → Tamil Nadu → India-wide attribution from voluntary geo and hub pages."
      />
      <p className={ui.meta}>{String(data?.attributionNote ?? '')}</p>

      <div className={ui.cardGrid} style={{ marginTop: 'var(--space-4)' }}>
        <SegmentCard title="Erode" segment={segments.erode} />
        <SegmentCard title="Tamil Nadu" segment={segments.tamilNadu} />
        <SegmentCard title="India (all signals)" segment={segments.india} />
      </div>

      {topStates.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Top states (provided)</h2>
          <ul className={ui.stack}>
            {topStates.map((row) => (
              <li key={row.state} className={`surface ${ui.dataCard}`}>
                {row.state} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topCities.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">Top cities (provided)</h2>
          <ul className={ui.stack}>
            {topCities.map((row) => (
              <li key={row.city} className={`surface ${ui.dataCard}`}>
                {row.city} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {byService.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">By service (India segment)</h2>
          <ul className={ui.stack}>
            {byService.map((row) => (
              <li key={row.service} className={`surface ${ui.dataCard}`}>
                {row.service} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
        <div className={layout.filterRow}>
          <h2 className="text-h3">Recent India-segment leads</h2>
          <Link className="link-underline" to={`${adminPortalPaths.crmLeadsList}?locality=india`}>
            View all with filter
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No leads yet" description="India-segment leads appear when attribution is captured." />
        ) : (
          <ul className={ui.stack}>
            {recent.map((lead) => (
              <li key={String(lead.id)} className={`surface ${ui.dataCard}`}>
                <Link className="link-underline" to={adminPortalPaths.crmLeadDetail(String(lead.id))}>
                  {String(lead.name)}
                </Link>
                <span className={ui.meta}>
                  {String(lead.serviceInterest ?? 'Service TBD')}
                  {lead.businessCity ? ` · ${String(lead.businessCity)}` : ''}
                  {lead.businessState ? ` · ${String(lead.businessState)}` : ''}
                </span>
                <StatusPill status={String(lead.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export function AdminInternationalMarketPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.local.internationalDashboard(), [])

  if (loading) return <ListSkeleton rows={8} />
  if (error) return <PortalError message={error} onRetry={reload} />

  const overall = (data?.overall as SegmentMetrics) ?? {}
  const tier1Markets =
    (data?.tier1Markets as Record<string, SegmentMetrics>) ?? {}
  const topCountries = (data?.topCountries as Array<{ country: string; count: number }>) ?? []
  const byService = (data?.byService as Array<{ service: string; count: number }>) ?? []
  const recent = (data?.recentLeads as Array<Record<string, unknown>>) ?? []

  const tier1Labels: Record<string, string> = {
    us: 'United States',
    uk: 'United Kingdom',
    ca: 'Canada',
    au: 'Australia',
    ae: 'UAE',
    sg: 'Singapore',
  }

  return (
    <>
      <PageIntro
        label="Global market"
        title="International segment"
        description="Tier 1 research markets—voluntary country and /international hub only."
      />
      <p className={ui.meta}>{String(data?.attributionNote ?? '')}</p>

      <div className={ui.cardGrid} style={{ marginTop: 'var(--space-4)' }}>
        <SegmentCard title="All international signals" segment={overall} />
        {Object.entries(tier1Markets).map(([key, segment]) => (
          <SegmentCard key={key} title={tier1Labels[key] ?? key} segment={segment} />
        ))}
      </div>

      {topCountries.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Top countries (provided)</h2>
          <ul className={ui.stack}>
            {topCountries.map((row) => (
              <li key={row.country} className={`surface ${ui.dataCard}`}>
                {row.country} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {byService.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">By service</h2>
          <ul className={ui.stack}>
            {byService.map((row) => (
              <li key={row.service} className={`surface ${ui.dataCard}`}>
                {row.service} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
        <div className={layout.filterRow}>
          <h2 className="text-h3">Recent international leads</h2>
          <Link
            className="link-underline"
            to={`${adminPortalPaths.crmLeadsList}?locality=international`}
          >
            View all with filter
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No leads yet" description="International leads appear when attribution is captured." />
        ) : (
          <ul className={ui.stack}>
            {recent.map((lead) => (
              <li key={String(lead.id)} className={`surface ${ui.dataCard}`}>
                <Link className="link-underline" to={adminPortalPaths.crmLeadDetail(String(lead.id))}>
                  {String(lead.name)}
                </Link>
                <span className={ui.meta}>
                  {String(lead.serviceInterest ?? 'Service TBD')}
                  {lead.businessCountry ? ` · ${String(lead.businessCountry)}` : ''}
                  {lead.contactTimezone ? ` · ${String(lead.contactTimezone)}` : ''}
                </span>
                <StatusPill status={String(lead.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
