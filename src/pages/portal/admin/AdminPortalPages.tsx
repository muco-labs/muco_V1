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
import { adminPortalPaths, leadStatusOptions, projectFulfillmentStatusOptions, proposalFulfillmentStatusOptions } from '@/config/admin-portal'
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
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(
    () =>
      adminApi.projects.list({
        status: statusFilter || undefined,
        q: q || undefined,
      }),
    [statusFilter, q],
  )

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  return (
    <>
      <PageIntro
        title="Projects"
        description="Delivery projects created from qualified customer requests."
      />
      <div className={layout.filterRow} style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <label>
          <span className={ui.meta}>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={ui.meta}
          >
            <option value="">All</option>
            {projectFulfillmentStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={ui.meta}>Search</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or service"
          />
        </label>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project from an eligible CRM lead when a request is ready for delivery."
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => (
            <li key={String(row.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={adminPortalPaths.projectDetail(String(row.id))}>
                <strong>{String(row.name)}</strong>
              </Link>
              <span className={ui.meta}>
                {String(row.reference)} · {String(row.companyName ?? '')}
              </span>
              <StatusPill status={String(row.status)} />
              {row.sourceRequestReference ? (
                <span className={ui.meta}>From {String(row.sourceRequestReference)}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminProjectDetailPage() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const canUpdate = Boolean(profile?.permissions.includes('projects.update'))
  const { data, error, loading, reload } = useFetch(() => adminApi.projects.get(id), [id])
  const [statusDraft, setStatusDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [milestoneName, setMilestoneName] = useState('')
  const [milestoneDue, setMilestoneDue] = useState('')
  const [milestoneBusy, setMilestoneBusy] = useState(false)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data?.project) return null

  const project = data.project as Record<string, unknown>
  const customer = data.customer as Record<string, unknown>
  const sourceLead = data.sourceLead as Record<string, unknown> | null | undefined
  const milestones = (data.milestones as Array<Record<string, unknown>>) ?? []
  const members = (data.members as Array<Record<string, unknown>>) ?? []
  const payment = data.payment as Record<string, unknown> | undefined
  const proposal = data.proposal as Record<string, unknown> | null | undefined
  const progressPercent = data.progressPercent as number | null | undefined
  const canStart = Boolean(data.canStart)
  const currentStatus = String(project.status ?? 'draft')
  const displayStatus = statusDraft || currentStatus

  async function saveStatus() {
    if (!canUpdate || !statusDraft || statusDraft === currentStatus) return
    setSaving(true)
    try {
      await adminApi.projects.update(id, { status: statusDraft })
      setStatusDraft('')
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not update status')
    } finally {
      setSaving(false)
    }
  }

  async function startDelivery() {
    if (!canUpdate) return
    setSaving(true)
    try {
      await adminApi.projects.start(id)
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not start project')
    } finally {
      setSaving(false)
    }
  }

  async function completeProject() {
    if (!canUpdate || !window.confirm('Mark this project as completed?')) return
    setSaving(true)
    try {
      await adminApi.projects.complete(id)
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not complete project')
    } finally {
      setSaving(false)
    }
  }

  async function addMilestone(e: FormEvent) {
    e.preventDefault()
    if (!canUpdate || !milestoneName.trim()) return
    setMilestoneBusy(true)
    try {
      await adminApi.projects.createMilestone(id, {
        name: milestoneName.trim(),
        dueDate: milestoneDue || undefined,
      })
      setMilestoneName('')
      setMilestoneDue('')
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not add milestone')
    } finally {
      setMilestoneBusy(false)
    }
  }

  async function setMilestoneStatus(milestoneId: string, status: string) {
    if (!canUpdate) return
    try {
      await adminApi.projects.updateMilestone(milestoneId, { status })
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not update milestone')
    }
  }

  return (
    <>
      <PageIntro
        title={String(project.name)}
        description={`${String(project.reference)} · ${String(customer.companyName ?? customer.contactName ?? '')}`}
      />
      <StatusPill status={currentStatus} />
      {progressPercent != null ? (
        <p className={ui.meta} aria-label={`Milestone progress ${progressPercent} percent`}>
          Milestone progress: {progressPercent}%
        </p>
      ) : (
        <p className={ui.meta}>No milestones yet — progress will appear when milestones are added.</p>
      )}
      {payment ? (
        <p className={ui.meta} role="status">
          Payment:{' '}
          {payment.paymentVerified
            ? 'Verified'
            : payment.paymentRequired
              ? 'Required before start'
              : 'Not required'}
        </p>
      ) : null}
      {proposal ? (
        <p className={ui.meta}>
          <Link className="link-underline" to={adminPortalPaths.proposalDetail(String(proposal.id))}>
            Proposal {String(proposal.reference)}
          </Link>
        </p>
      ) : null}
      <dl className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <div>
          <dt className={ui.meta}>Service</dt>
          <dd>{String(project.service ?? '—')}</dd>
        </div>
        <div>
          <dt className={ui.meta}>Description</dt>
          <dd>{String(project.description ?? '—')}</dd>
        </div>
        <div>
          <dt className={ui.meta}>Start date</dt>
          <dd>
            {project.startDate ? new Date(String(project.startDate)).toLocaleDateString() : '—'}
          </dd>
        </div>
        <div>
          <dt className={ui.meta}>Target date</dt>
          <dd>
            {project.expectedCompletion
              ? new Date(String(project.expectedCompletion)).toLocaleDateString()
              : '—'}
          </dd>
        </div>
      </dl>

      {sourceLead ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Source request</h2>
          <p className={ui.meta}>
            {String(sourceLead.reference)} · CRM status {String(sourceLead.status)}
          </p>
          <p>{String(sourceLead.projectDescription ?? '')}</p>
          {sourceLead.budget || sourceLead.timeline ? (
            <p className={ui.meta}>
              {[sourceLead.budget, sourceLead.timeline].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          <Link className="link-underline" to={adminPortalPaths.crmLeadDetail(String(sourceLead.id))}>
            Open lead
          </Link>
        </section>
      ) : null}

      <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h3">Milestones</h2>
        {milestones.length === 0 ? (
          <EmptyState title="No milestones" description="Add milestones to track delivery progress." />
        ) : (
          <ul className={ui.stack}>
            {milestones.map((m) => (
              <li key={String(m.id)} className={`surface ${ui.dataCard}`}>
                <strong>{String(m.name)}</strong>
                <StatusPill status={String(m.status)} />
                {m.dueHint ? <span className={ui.meta}>{String(m.dueHint)}</span> : null}
                {m.dueDate ? (
                  <span className={ui.meta}>Due {new Date(String(m.dueDate)).toLocaleDateString()}</span>
                ) : null}
                {canUpdate ? (
                  <div className={ui.actionsRow}>
                    {m.status === 'planned' ? (
                      <Button type="button" variant="secondary" onClick={() => void setMilestoneStatus(String(m.id), 'in_progress')}>
                        Start
                      </Button>
                    ) : null}
                    {m.status === 'in_progress' ? (
                      <Button type="button" onClick={() => void setMilestoneStatus(String(m.id), 'completed')}>
                        Complete
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canUpdate ? (
          <form className={ui.form} onSubmit={(e) => void addMilestone(e)}>
            <div className={ui.field}>
              <label htmlFor="milestone-name">New milestone</label>
              <input
                id="milestone-name"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div className={ui.field}>
              <label htmlFor="milestone-due">Due date (optional)</label>
              <input
                id="milestone-due"
                type="date"
                value={milestoneDue}
                onChange={(e) => setMilestoneDue(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={milestoneBusy}>
              {milestoneBusy ? 'Adding…' : 'Add milestone'}
            </Button>
          </form>
        ) : null}
      </section>

      {members.length > 0 ? (
        <section style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Team</h2>
          <ul className={ui.stack}>
            {members.map((m) => (
              <li key={String(m.employeeId)} className={ui.meta}>
                {String(m.displayName)} · {String(m.role)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canUpdate ? (
        <section className={`surface ${ui.dataCard}`} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Delivery actions</h2>
          {canStart ? (
            <Button type="button" disabled={saving} onClick={() => void startDelivery()}>
              Start delivery
            </Button>
          ) : null}
          {currentStatus === 'active' ? (
            <Button type="button" variant="secondary" disabled={saving} onClick={() => void completeProject()}>
              Mark completed
            </Button>
          ) : null}
        </section>
      ) : null}

      {canUpdate ? (
        <section className={`surface ${ui.dataCard}`} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Update status</h2>
          <select
            value={displayStatus}
            onChange={(e) => setStatusDraft(e.target.value)}
            aria-label="Project status"
          >
            {projectFulfillmentStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button type="button" disabled={saving} onClick={() => void saveStatus()}>
            Save status
          </Button>
        </section>
      ) : null}

      <p style={{ marginTop: 'var(--space-4)' }}>
        <Link className="link-underline" to={adminPortalPaths.projects}>
          Back to projects
        </Link>
      </p>
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
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(
    () =>
      adminApi.proposals.list({
        status: statusFilter || undefined,
        q: q || undefined,
      }),
    [statusFilter, q],
  )
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro
        title="Proposals"
        description="Draft, send, and track customer quotes linked to leads and projects."
      />
      <div className={layout.filterRow} style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Link className="button" to={adminPortalPaths.proposalNew}>
          New proposal
        </Link>
        <label>
          <span className={ui.meta}>Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {proposalFulfillmentStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={ui.meta}>Search</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or scope" />
        </label>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No proposals yet" description="Create a draft proposal when scope and pricing are ready." />
      ) : (
        <ul className={ui.stack}>
          {items.map((p) => (
            <li key={String(p.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={adminPortalPaths.proposalDetail(String(p.id))}>
                <strong>{String(p.title ?? 'Proposal')}</strong>
              </Link>
              <span className={ui.meta}>
                {String(p.reference)} · {String(p.companyName ?? '')}
              </span>
              {p.total || p.amount ? (
                <span className={ui.meta}>{formatInr(String(p.total ?? p.amount))}</span>
              ) : null}
              <StatusPill status={String(p.status)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminProposalNewPage() {
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get('leadId') ?? ''
  const customerId = searchParams.get('customerId') ?? ''
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      let result: Record<string, unknown>
      if (leadId) {
        result = (await adminApi.proposals.createFromLead(leadId, {
          title: title || undefined,
          scope: scope || undefined,
        })) as Record<string, unknown>
      } else {
        if (!customerId) {
          setError('Select a customer or open this form from a CRM lead.')
          setSaving(false)
          return
        }
        result = (await adminApi.proposals.create({
          customerId,
          title: title || undefined,
          scope: scope || undefined,
          leadId: leadId || undefined,
        })) as Record<string, unknown>
      }
      const proposal = (result.proposal ?? result) as Record<string, unknown>
      window.location.assign(adminPortalPaths.proposalDetail(String(proposal.id)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create proposal')
      setSaving(false)
    }
  }

  return (
    <>
      <PageIntro title="New proposal" description="Start a draft quote. Add line items on the detail page." />
      <form className={ui.form} onSubmit={(e) => void submit(e)}>
        <div className={ui.field}>
          <label htmlFor="prop-title">Title</label>
          <input id="prop-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
        </div>
        <div className={ui.field}>
          <label htmlFor="prop-scope">Scope summary</label>
          <textarea id="prop-scope" value={scope} onChange={(e) => setScope(e.target.value)} rows={4} />
        </div>
        {error ? <PortalError message={error} /> : null}
        <Button type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Create draft'}
        </Button>
      </form>
    </>
  )
}

export function AdminProposalDetailPage() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const canUpdate = Boolean(profile?.permissions.includes('proposals.update'))
  const canSend = Boolean(
    profile?.permissions.includes('proposals.send') || profile?.permissions.includes('proposals.create'),
  )
  const { data, error, loading, reload } = useFetch(() => adminApi.proposals.get(id), [id])
  const [scopeDraft, setScopeDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const proposal = data?.proposal as Record<string, unknown> | undefined
    if (proposal?.scope) setScopeDraft(String(proposal.scope))
  }, [data])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data?.proposal) return null

  const proposal = data.proposal as Record<string, unknown>
  const lineItems = (data.lineItems as Array<Record<string, unknown>>) ?? []
  const pricing = data.pricing as Record<string, unknown> | undefined
  const status = String(proposal.status ?? 'draft')

  async function saveDraft() {
    if (!canUpdate || status !== 'draft') return
    setSaving(true)
    try {
      await adminApi.proposals.update(id, { scope: scopeDraft })
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function send() {
    if (!canSend || !window.confirm('Send this proposal to the customer portal?')) return
    try {
      await adminApi.proposals.send(id)
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not send')
    }
  }

  async function cancel() {
    if (!canUpdate || !window.confirm('Withdraw this proposal?')) return
    try {
      await adminApi.proposals.cancel(id)
      await reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not cancel')
    }
  }

  return (
    <>
      <PageIntro
        title={String(proposal.title ?? 'Proposal')}
        description={`${String(proposal.reference)} · ${String((data.customer as Record<string, unknown>)?.companyName ?? '')}`}
      />
      <StatusPill status={status} />
      {proposal.sourceRequestReference ? (
        <p className={ui.meta}>Request {String(proposal.sourceRequestReference)}</p>
      ) : null}
      {proposal.projectReference ? (
        <p className={ui.meta}>Project {String(proposal.projectReference)}</p>
      ) : null}

      {canUpdate && status === 'draft' ? (
        <section className={`surface ${ui.dataCard}`} style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">Edit draft</h2>
          <textarea value={scopeDraft} onChange={(e) => setScopeDraft(e.target.value)} rows={5} aria-label="Scope" />
          <Button type="button" disabled={saving} onClick={() => void saveDraft()}>
            Save draft
          </Button>
        </section>
      ) : proposal.scope ? (
        <p style={{ marginTop: 'var(--space-4)' }}>{String(proposal.scope)}</p>
      ) : null}

      {lineItems.length > 0 ? (
        <section style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Line items</h2>
          <ul className={ui.stack}>
            {lineItems.map((item) => (
              <li key={String(item.id)} className={ui.meta}>
                {String(item.description)} — {String(item.quantity)} × {formatInr(String(item.unitAmount))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pricing ? (
        <p className={ui.meta} style={{ marginTop: 'var(--space-4)' }}>
          Subtotal {formatInr(String(pricing.subtotal))} · Total {formatInr(String(pricing.total))}
        </p>
      ) : null}

      <div className={layout.filterRow} style={{ marginTop: 'var(--space-6)' }}>
        {canSend && status === 'draft' ? (
          <Button type="button" onClick={() => void send()}>
            Send to customer
          </Button>
        ) : null}
        {canUpdate && ['draft', 'sent', 'viewed', 'changes_requested'].includes(status) ? (
          <Button type="button" variant="secondary" onClick={() => void cancel()}>
            Cancel proposal
          </Button>
        ) : null}
      </div>

      <p style={{ marginTop: 'var(--space-4)' }}>
        <Link className="link-underline" to={adminPortalPaths.proposals}>
          Back to proposals
        </Link>
      </p>
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
              <Link className="link-underline" to={adminPortalPaths.paymentDetail(String(pay.id))}>
                {String(pay.reference ?? pay.id).slice(0, 20)}
              </Link>
              {formatInr(String(pay.amount))}
              <StatusPill status={String(pay.status)} />
              {pay.proposalId ? <span className={ui.meta}>Proposal linked</span> : null}
              {pay.gatewayReference ? (
                <span className={ui.meta}>Provider ref: {String(pay.gatewayReference)}</span>
              ) : null}
              <span className={ui.meta}>{new Date(String(pay.createdAt)).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminPaymentDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => adminApi.payments.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const payment = (data.payment ?? data) as Record<string, unknown>
  const proposal = data.proposal as Record<string, unknown> | null | undefined

  return (
    <>
      <PageIntro
        title={String(payment.reference ?? 'Payment')}
        description="Customer payment record (provider references only — no secrets)."
      />
      <StatusPill status={String(payment.status)} />
      <dl className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <div>
          <dt className={ui.meta}>Amount</dt>
          <dd>{formatInr(String(payment.amount))}</dd>
        </div>
        <div>
          <dt className={ui.meta}>Currency</dt>
          <dd>{String(payment.currency ?? 'INR')}</dd>
        </div>
        <div>
          <dt className={ui.meta}>Provider</dt>
          <dd>{String(payment.provider ?? 'razorpay')}</dd>
        </div>
        {payment.gatewayReference ? (
          <div>
            <dt className={ui.meta}>Provider order / payment ID</dt>
            <dd>{String(payment.gatewayReference)}</dd>
          </div>
        ) : null}
        <div>
          <dt className={ui.meta}>Created</dt>
          <dd>{new Date(String(payment.createdAt)).toLocaleString()}</dd>
        </div>
        {payment.paidAt ? (
          <div>
            <dt className={ui.meta}>Paid</dt>
            <dd>{new Date(String(payment.paidAt)).toLocaleString()}</dd>
          </div>
        ) : null}
        {payment.signatureVerified != null ? (
          <div>
            <dt className={ui.meta}>Signature verified</dt>
            <dd>{payment.signatureVerified ? 'Yes' : 'No'}</dd>
          </div>
        ) : null}
      </dl>
      {proposal ? (
        <section style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Proposal</h2>
          <p className={ui.meta}>
            <Link className="link-underline" to={adminPortalPaths.proposalDetail(String(proposal.id))}>
              {String(proposal.reference ?? proposal.title)}
            </Link>
          </p>
          {proposal.projectReference ? (
            <p className={ui.meta}>Project {String(proposal.projectReference)}</p>
          ) : null}
        </section>
      ) : null}
      <p style={{ marginTop: 'var(--space-6)' }}>
        <Link className="link-underline" to={adminPortalPaths.payments}>
          Back to payments
        </Link>
      </p>
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
