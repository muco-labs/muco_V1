import { useState, useEffect, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PageIntro,
  PortalAttention,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { useFetch } from '@/hooks/useFetch'
import { freelancerApi, type FreelancerProjectSummary, type FreelancerTask } from '@/services/freelancer-portal'
import { freelancerPortalPaths } from '@/config/freelancer-portal'
import { Button } from '@/components/ui/Button'
import {
  approvalStatusLabel,
  availabilityStatusTone,
  friendlyFreelancerPortalError,
} from '@/lib/freelancer/portal-errors'
import { taskStatusTone } from '@/lib/employee/portal-errors'

const TASK_STATUS_OPTIONS = ['todo', 'in_progress', 'blocked', 'done'] as const

export function FreelancerDashboardPage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.dashboard(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const profile = data?.profile as Record<string, unknown> | undefined
  const projects = data?.projects ?? []
  const availability = data?.availability as Record<string, unknown> | undefined
  const workload = data?.workload as Record<string, unknown> | undefined
  const overdue = Number(workload?.overdueTaskCount ?? 0)
  const blocked = Number(workload?.blockedTaskCount ?? 0)
  const availStatus = availability ? String(availability.availabilityStatus) : ''
  const needsAttention = overdue > 0 || blocked > 0

  return (
    <>
      {needsAttention ? (
        <PortalAttention
          title={
            overdue > 0 && blocked > 0
              ? `${overdue} overdue and ${blocked} blocked task${blocked === 1 ? '' : 's'}`
              : overdue > 0
                ? `${overdue} overdue task${overdue === 1 ? '' : 's'}`
                : `${blocked} blocked task${blocked === 1 ? '' : 's'}`
          }
          description="Review assigned tasks and update status when you can."
        >
          <Link className="link-underline" to={freelancerPortalPaths.tasks}>
            Open tasks
          </Link>
        </PortalAttention>
      ) : null}
      {availStatus === 'unavailable' ? (
        <PortalAttention
          title="You are marked unavailable"
          description="MUCO will not assign new work until you update availability."
        >
          <Link className="link-underline" to={freelancerPortalPaths.availability}>
            Update availability
          </Link>
        </PortalAttention>
      ) : null}

      <PageIntro
        label="Freelancer workspace"
        title={profile ? `Welcome, ${String(profile.fullName)}` : 'Dashboard'}
        description={
          profile
            ? approvalStatusLabel(String(profile.approvalStatus ?? 'pending'))
            : 'Your assignments and operational status.'
        }
      />

      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Availability</h2>
          {availability ? (
            <>
              <StatusPill
                status={String(availability.availabilityStatusLabel ?? availability.availabilityStatus)}
                tone={availabilityStatusTone(availStatus)}
              />
              {availability.availabilityNote ? (
                <p className={ui.meta}>{String(availability.availabilityNote)}</p>
              ) : null}
              <Link className="link-underline" to={freelancerPortalPaths.availability}>
                Manage availability
              </Link>
            </>
          ) : (
            <p className={ui.meta}>Availability not loaded.</p>
          )}
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Workload</h2>
          {workload ? (
            <ul className={ui.meta} style={{ margin: 0, paddingLeft: '1.1rem' }}>
              <li>Active projects: {Number(workload.activeProjectCount ?? 0)}</li>
              <li>Active tasks: {Number(workload.activeTaskCount ?? 0)}</li>
              <li>Overdue tasks: {overdue}</li>
              <li>Blocked tasks: {blocked}</li>
            </ul>
          ) : (
            <p className={ui.meta}>No workload data.</p>
          )}
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h2 className="text-h3" style={{ margin: 0 }}>
              Assigned projects
            </h2>
            <Link className="link-underline" to={freelancerPortalPaths.projects}>
              View all
            </Link>
          </div>
          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description={String(data.assignmentsMessage ?? 'When MUCO assigns you to a project, it will appear here.')}
            />
          ) : (
            <ul className={ui.stack}>
              {projects.map((p) => (
                <li key={p.id}>
                  <Link className="link-underline" to={freelancerPortalPaths.projectDetail(p.id)}>
                    {p.name}
                  </Link>
                  <p className={ui.meta}>
                    {p.reference} · {p.statusLabel} · {p.activeTaskCount} active tasks
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
      {profile ? (
        <p className={ui.meta} style={{ marginTop: 'var(--space-6)' }}>
          Verification: {String(profile.verificationStatus ?? '—')}
        </p>
      ) : null}
    </>
  )
}

export function FreelancerProjectsPage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.listProjects(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <PageIntro title="My projects" description="Projects you are assigned to on the MUCO network." />
      {items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="When MUCO assigns you to a project, it will appear here."
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((p: FreelancerProjectSummary) => (
            <li key={p.id} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={freelancerPortalPaths.projectDetail(p.id)}>
                <strong>{p.name}</strong>
              </Link>
              <p className={ui.meta}>
                {p.reference} · {p.statusLabel} · {p.projectRoleLabel}
              </p>
              <p className={ui.meta}>
                Tasks: {p.assignedTaskCount} assigned · {p.activeTaskCount} active
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function FreelancerProjectDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => freelancerApi.getProject(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const tasks = (data.tasks as FreelancerTask[]) ?? []

  return (
    <>
      <PageIntro
        label="Project"
        title={data.name}
        description={`${data.reference} · ${data.statusLabel} · ${data.projectRoleLabel}`}
      />
      <p className={ui.meta}>
        <Link className="link-underline" to={freelancerPortalPaths.projects}>
          Back to projects
        </Link>
      </p>
      <section aria-labelledby="freelancer-project-tasks">
        <h2 id="freelancer-project-tasks" className="text-h3">
          Your tasks
        </h2>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks assigned" description="Tasks assigned to you will show here." />
        ) : (
          <ul className={ui.stack}>
            {tasks.map((task) => (
              <li key={task.id} className={`surface ${ui.dataCard}`}>
                <FreelancerTaskRow task={task} onUpdated={reload} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function FreelancerTaskRow({ task, onUpdated }: { task: FreelancerTask; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setBusy(true)
    setMessage(null)
    try {
      await freelancerApi.updateTaskStatus(task.id, status)
      setMessage('Status updated.')
      onUpdated()
    } catch {
      setMessage('Could not update task.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={ui.stack}>
      <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 12rem' }}>
          <strong>{task.title}</strong>
          <p className={ui.meta}>
            {task.reference}
            {task.milestoneName ? ` · ${task.milestoneName}` : ''}
            {task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
          </p>
          {task.nextAction ? <p className={ui.meta}>{task.nextAction}</p> : null}
        </div>
        <StatusPill status={task.statusLabel ?? task.status} tone={taskStatusTone(task.status)} />
      </div>
      {task.status !== 'done' && task.status !== 'cancelled' ? (
        <label className={ui.field}>
          <span className={ui.meta}>Update status</span>
          <select
            value={task.status}
            disabled={busy}
            aria-label={`Status for ${task.title}`}
            onChange={(e) => void updateStatus(e.target.value)}
          >
            {TASK_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className={ui.meta} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}

export function FreelancerTasksPage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.listTasks(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <PageIntro title="Assigned tasks" description="Tasks across your projects that need your action." />
      {items.length === 0 ? (
        <EmptyState title="No tasks" description="Tasks assigned to you across projects appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((task) => (
            <li key={task.id} className={`surface ${ui.dataCard}`}>
              <FreelancerTaskRow task={task} onUpdated={reload} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function FreelancerProfilePage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.profile(), [])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />
  if (!data) return null

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    const form = new FormData(e.currentTarget)
    try {
      await freelancerApi.updateProfile({
        headline: String(form.get('headline') || ''),
        bio: String(form.get('bio') || ''),
        skills: String(form.get('skills') || ''),
      })
      setStatus('Profile saved.')
      reload()
    } catch {
      setStatus('Could not save profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageIntro title="Profile" description="Your public freelancer identity on the MUCO network." />
      <form onSubmit={(e) => void save(e)} className="stack" style={{ maxWidth: '36rem' }}>
        <label>
          Headline
          <input name="headline" defaultValue={String(data.headline ?? '')} maxLength={200} />
        </label>
        <label>
          Bio
          <textarea name="bio" defaultValue={String(data.bio ?? '')} required minLength={20} rows={5} />
        </label>
        <label>
          Skills
          <textarea name="skills" defaultValue={String(data.skills ?? '')} required rows={3} />
        </label>
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </form>
    </>
  )
}

export function FreelancerAvailabilityPage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.getAvailability(), [])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'available' | 'limited' | 'unavailable'>('available')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!data) return
    const s = data.availabilityStatus
    if (s === 'available' || s === 'limited' || s === 'unavailable') setStatus(s)
    if (typeof data.availabilityNote === 'string') setNote(data.availabilityNote)
  }, [data])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const canManage = Boolean(data.canManageAvailability)
  const currentStatus = String(data.availabilityStatus)
  const currentLabel = String(data.availabilityStatusLabel ?? currentStatus)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!canManage) return
    setBusy(true)
    setMessage(null)
    try {
      await freelancerApi.updateAvailability({
        availabilityStatus: status,
        availabilityNote: note.trim() || undefined,
      })
      setMessage('Availability saved.')
      reload()
    } catch {
      setMessage('Could not save availability. You must be verified and approved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageIntro
        title="Availability"
        description="Controls whether MUCO can assign you new work. Unavailable freelancers are excluded from new assignments."
      />
      <p>
        Current:{' '}
        <StatusPill status={currentLabel} tone={availabilityStatusTone(currentStatus)} />
      </p>
      {data.availabilityNote ? <p className={ui.meta}>{String(data.availabilityNote)}</p> : null}
      {!canManage ? (
        <p>Availability can be updated after MUCO verifies and approves your profile.</p>
      ) : (
        <form onSubmit={(e) => void save(e)} className={ui.stack} style={{ maxWidth: '28rem' }}>
          <fieldset className={ui.stack}>
            <legend className="text-h3">Set availability</legend>
            {(
              [
                ['available', 'Available — open for new assignments'],
                ['limited', 'Limited capacity — still eligible for new work'],
                ['unavailable', 'Unavailable — no new assignments'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className={ui.field}>
                <input
                  type="radio"
                  name="availabilityStatus"
                  value={value}
                  checked={status === value}
                  disabled={busy}
                  onChange={() => setStatus(value)}
                />{' '}
                {label}
              </label>
            ))}
          </fieldset>
          <label className={ui.field}>
            <span>Note (optional)</span>
            <textarea
              value={note}
              maxLength={1000}
              rows={3}
              aria-label="Availability note"
              placeholder={String(data.availabilityNote ?? '')}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => {
                if (!note && data.availabilityNote) setNote(String(data.availabilityNote))
              }}
            />
          </label>
          <Button type="submit" disabled={busy}>
            Save availability
          </Button>
        </form>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </>
  )
}

const PRICING_TYPES = ['fixed', 'starting_from', 'hourly', 'per_project', 'custom_quote'] as const

type CatalogService = {
  slug: string
  title: string
  subServices: Array<{ id: string; label: string }>
}

type ServiceRow = {
  id: string
  serviceSlug: string
  serviceTitle: string
  subServiceSlug: string | null
  subServiceLabel: string | null
  description: string | null
  pricingType: string
  basePrice: string | null
  currency: string
  isActive: boolean
  isEffectivelyActive: boolean
}

export function FreelancerServicesPage() {
  const catalogFetch = useFetch(() => freelancerApi.serviceCatalog(), [])
  const { data, error, loading, reload } = useFetch(() => freelancerApi.listServices(), [])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [serviceSlug, setServiceSlug] = useState('')
  const [subServiceSlug, setSubServiceSlug] = useState('')
  const [pricingType, setPricingType] = useState<string>('custom_quote')
  const [basePrice, setBasePrice] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [isActive, setIsActive] = useState(false)

  const catalog = (catalogFetch.data?.items as CatalogService[]) ?? []
  const items = (data?.items as ServiceRow[]) ?? []
  const selected = catalog.find((c) => c.slug === serviceSlug)

  if (loading || catalogFetch.loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />

  async function addService(e: FormEvent) {
    e.preventDefault()
    if (!serviceSlug) return
    setBusy(true)
    setMessage(null)
    try {
      await freelancerApi.createService({
        serviceSlug,
        subServiceSlug: subServiceSlug || null,
        pricingType,
        basePrice: basePrice || null,
        currency,
        isActive,
      })
      setMessage('Service saved.')
      setServiceSlug('')
      setSubServiceSlug('')
      setBasePrice('')
      reload()
    } catch {
      setMessage('Could not save service. Check pricing and duplicates.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(row: ServiceRow) {
    setBusy(true)
    setMessage(null)
    try {
      await freelancerApi.updateService(row.id, { isActive: !row.isActive })
      reload()
    } catch {
      setMessage('Could not update service.')
    } finally {
      setBusy(false)
    }
  }

  async function removeService(id: string) {
    if (!window.confirm('Remove this service offering?')) return
    setBusy(true)
    try {
      await freelancerApi.deleteService(id)
      reload()
    } catch {
      setMessage('Could not remove service.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageIntro
        title="My services"
        description="MUCO catalog services you deliver. Pricing is for internal operations—not shown on the public site."
      />
      <p className={ui.meta} role="status" aria-live="polite">
        {message}
      </p>
      {items.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Add MUCO catalog services you deliver. Base price is internal to MUCO—not shown to customers."
        />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => (
            <li key={row.id} className={`surface ${ui.dataCard}`}>
              <strong>{row.serviceTitle}</strong>
              {row.subServiceLabel ? <span className={ui.meta}> · {row.subServiceLabel}</span> : null}
              <p className={ui.meta}>
                {row.pricingType.replace(/_/g, ' ')}
                {row.basePrice ? ` · ${row.currency} ${row.basePrice}` : ''} ·{' '}
                {row.isEffectivelyActive ? 'Active' : 'Inactive'}
              </p>
              <div className={ui.actionsRow}>
                <Button type="button" disabled={busy} onClick={() => void toggleActive(row)}>
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button type="button" variant="ghost" disabled={busy} onClick={() => void removeService(row.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className={ui.form} onSubmit={(e) => void addService(e)} style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h3">Add service</h2>
        <label className={ui.field}>
          Service
          <select
            required
            value={serviceSlug}
            aria-label="MUCO service"
            onChange={(e) => {
              setServiceSlug(e.target.value)
              setSubServiceSlug('')
            }}
          >
            <option value="">Select service</option>
            {catalog.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {selected && selected.subServices.length > 0 ? (
          <label className={ui.field}>
            Sub-service (optional)
            <select
              value={subServiceSlug}
              aria-label="Sub-service"
              onChange={(e) => setSubServiceSlug(e.target.value)}
            >
              <option value="">General offering</option>
              {selected.subServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={ui.field}>
          Pricing type
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value)} aria-label="Pricing type">
            {PRICING_TYPES.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          Base price (freelancer)
          <input
            type="number"
            min={0}
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            aria-label="Base price"
          />
        </label>
        <label className={ui.field}>
          Currency
          <input value={currency} maxLength={8} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency" />
        </label>
        <label>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active offering
        </label>
        <Button type="submit" disabled={busy}>
          Save service
        </Button>
      </form>
    </>
  )
}

type SkillRow = {
  id: string
  serviceTitle: string
  skillLabel: string
  serviceSlug: string
  skillSlug: string
}

export function FreelancerSkillsPage() {
  const catalogFetch = useFetch(() => freelancerApi.serviceCatalog(), [])
  const { data, error, loading, reload } = useFetch(() => freelancerApi.listSkills(), [])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [serviceSlug, setServiceSlug] = useState('')
  const [skillSlug, setSkillSlug] = useState('')

  const catalog = (catalogFetch.data?.items as CatalogService[]) ?? []
  const items = (data?.items as SkillRow[]) ?? []
  const selected = catalog.find((c) => c.slug === serviceSlug)

  if (loading || catalogFetch.loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyFreelancerPortalError(error)} onRetry={reload} />

  async function addSkill(e: FormEvent) {
    e.preventDefault()
    if (!serviceSlug || !skillSlug) return
    setBusy(true)
    setMessage(null)
    try {
      await freelancerApi.createSkill({ serviceSlug, skillSlug })
      setMessage('Skill added.')
      setSkillSlug('')
      reload()
    } catch {
      setMessage('Could not add skill.')
    } finally {
      setBusy(false)
    }
  }

  async function removeSkill(id: string) {
    setBusy(true)
    try {
      await freelancerApi.deleteSkill(id)
      reload()
    } catch {
      setMessage('Could not remove skill.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageIntro title="My skills" description="Skills tied to MUCO catalog services you deliver." />
      <p className={ui.meta} role="status" aria-live="polite">
        {message}
      </p>
      {items.length === 0 ? (
        <EmptyState title="No skills yet" description="Select skills from the MUCO service catalog." />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => (
            <li key={row.id} className={`surface ${ui.dataCard}`}>
              <strong>{row.skillLabel}</strong>
              <p className={ui.meta}>{row.serviceTitle}</p>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void removeSkill(row.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form className={ui.form} onSubmit={(e) => void addSkill(e)} style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h3">Add skill</h2>
        <label className={ui.field}>
          Service
          <select
            required
            value={serviceSlug}
            aria-label="Service for skill"
            onChange={(e) => {
              setServiceSlug(e.target.value)
              setSkillSlug('')
            }}
          >
            <option value="">Select service</option>
            {catalog.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {selected && selected.subServices.length > 0 ? (
          <label className={ui.field}>
            Skill
            <select
              required
              value={skillSlug}
              aria-label="Skill"
              onChange={(e) => setSkillSlug(e.target.value)}
            >
              <option value="">Select skill</option>
              {selected.subServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button type="submit" disabled={busy || !skillSlug}>
          Add skill
        </Button>
      </form>
    </>
  )
}
