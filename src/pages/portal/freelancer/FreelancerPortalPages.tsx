import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ListSkeleton, PortalError, StatusPill } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { useFetch } from '@/hooks/useFetch'
import { freelancerApi, type FreelancerProjectSummary, type FreelancerTask } from '@/services/freelancer-portal'
import { freelancerPortalPaths } from '@/config/freelancer-portal'
import { Button } from '@/components/ui/Button'

const TASK_STATUS_OPTIONS = ['todo', 'in_progress', 'blocked', 'done'] as const

export function FreelancerDashboardPage() {
  const { data, error, loading } = useFetch(() => freelancerApi.dashboard(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} />

  const profile = data?.profile as Record<string, unknown> | undefined
  const projects = data?.projects ?? []

  return (
    <>
      <h1 className="text-h2">Freelancer dashboard</h1>
      {profile ? (
        <p>
          {String(profile.fullName)} · Verification {String(profile.verificationStatus)} · Approval{' '}
          {String(profile.approvalStatus)}
        </p>
      ) : null}
      <section aria-labelledby="assignments-heading">
        <h2 id="assignments-heading" className="text-h3">
          Assigned work
        </h2>
        {projects.length === 0 ? (
          <p>{data?.assignmentsMessage}</p>
        ) : (
          <ul className={ui.stack}>
            {projects.map((p) => (
              <li key={p.id} className={`surface ${ui.dataCard}`}>
                <Link className="link-underline" to={freelancerPortalPaths.projectDetail(p.id)}>
                  <strong>{p.name}</strong>
                </Link>
                <p className={ui.meta}>
                  {p.reference} · {p.statusLabel} · {p.projectRoleLabel} · {p.activeTaskCount} active
                  tasks
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export function FreelancerProjectsPage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.listProjects(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <h1 className="text-h2">My projects</h1>
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
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const tasks = (data.tasks as FreelancerTask[]) ?? []

  return (
    <>
      <p>
        <Link to={freelancerPortalPaths.projects}>← My projects</Link>
      </p>
      <h1 className="text-h2">{data.name}</h1>
      <p className={ui.meta}>
        {data.reference} · {data.statusLabel} · {data.projectRoleLabel}
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
        <StatusPill status={task.status} />
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
  if (error) return <PortalError message={error} onRetry={reload} />

  const items = data?.items ?? []

  return (
    <>
      <h1 className="text-h2">Assigned tasks</h1>
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
  if (error) return <PortalError message={error} onRetry={reload} />
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
      <h1 className="text-h2">Profile</h1>
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
  const { data, error, loading, reload } = useFetch(() => freelancerApi.profile(), [])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const canManage = Boolean(data.canManageAvailability)

  async function setAvailability(status: 'available' | 'unavailable') {
    setBusy(true)
    setMessage(null)
    try {
      await freelancerApi.updateAvailability({ availabilityStatus: status })
      setMessage('Availability updated.')
      reload()
    } catch {
      setMessage('Availability cannot be changed until you are verified and approved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="text-h2">Availability</h1>
      <p>Current: {String(data.availabilityStatus)}</p>
      {!canManage ? (
        <p>Availability can be updated after MUCO verifies and approves your profile.</p>
      ) : (
        <div className="actions-row">
          <Button type="button" disabled={busy} onClick={() => void setAvailability('available')}>
            Mark available
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void setAvailability('unavailable')}>
            Mark unavailable
          </Button>
        </div>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </>
  )
}
