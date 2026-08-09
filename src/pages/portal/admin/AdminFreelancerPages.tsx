import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PageIntro,
  PortalError,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { adminPortalPaths } from '@/config/admin-portal'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { friendlyAdminPortalError } from '@/lib/admin/portal-errors'
import { Button } from '@/components/ui/Button'
import { AdminFreelancerDiscoveryPanel } from '@/components/portal/AdminFreelancerDiscoveryPanel'
import { useAuth } from '@/contexts/auth-context'

export function AdminFreelancersPage() {
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(
    () => adminApi.freelancers.list({ q: q || undefined }),
    [q],
  )
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyAdminPortalError(error)} onRetry={reload} />

  return (
    <>
      <PageIntro title="Freelancers" description="Approved network onboarding and verification." />
      <p>
        <Link className="link-underline" to={adminPortalPaths.freelancersDiscover}>
          Discover freelancers for projects and tasks
        </Link>
      </p>
      <label className={ui.field}>
        Search
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search freelancers" />
      </label>
      {items.length === 0 ? (
        <EmptyState title="No freelancers" description="Applications will appear here after submission." />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => (
            <li key={String(row.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={adminPortalPaths.freelancerDetail(String(row.id))}>
                <strong>{String(row.fullName)}</strong>
              </Link>
              <p className={ui.meta}>
                {String(row.reference)} · {String(row.email)} · {String(row.professionalRole)}
              </p>
              <p className={ui.meta}>
                Verification {String(row.verificationStatus)} · Approval {String(row.approvalStatus)} ·{' '}
                {String(row.availabilityStatusLabel ?? row.availabilityStatus)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminFreelancerDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => adminApi.freelancers.get(id), [id])
  const servicesFetch = useFetch(() => adminApi.freelancers.listServices(id), [id])
  const skillsFetch = useFetch(() => adminApi.freelancers.listSkills(id), [id])
  const workloadFetch = useFetch(() => adminApi.freelancers.getWorkload(id), [id])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={friendlyAdminPortalError(error)} onRetry={reload} />
  if (!data) return null

  const notes = (data.internalNotes as Array<Record<string, unknown>>) ?? []
  const services = (servicesFetch.data?.items as Array<Record<string, unknown>>) ?? []
  const skills = (skillsFetch.data?.items as Array<Record<string, unknown>>) ?? []
  const workload = workloadFetch.data

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    try {
      await adminApi.freelancers.patch(id, body)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setBusy(true)
    try {
      await adminApi.freelancers.addNote(id, note.trim())
      setNote('')
      await reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageIntro title={String(data.fullName)} description={String(data.reference)} />
      <p className={ui.meta}>{String(data.email)}</p>
      <p className={ui.meta}>
        Verification {String(data.verificationStatus)} · Approval {String(data.approvalStatus)} ·{' '}
        {String(data.availabilityStatusLabel ?? data.availabilityStatus)}
      </p>
      {data.availabilityNote ? (
        <p className={ui.meta}>Availability note: {String(data.availabilityNote)}</p>
      ) : null}
      <section aria-labelledby="fl-workload-heading" className={ui.stack}>
        <h2 id="fl-workload-heading" className="text-h3">
          Workload
        </h2>
        {workloadFetch.loading ? (
          <p className={ui.meta}>Loading workload…</p>
        ) : workloadFetch.error ? (
          <p className={ui.meta}>Could not load workload.</p>
        ) : workload ? (
          <ul className={ui.meta}>
            <li>Active projects: {Number(workload.activeProjectCount ?? 0)}</li>
            <li>Active tasks: {Number(workload.activeTaskCount ?? 0)}</li>
            <li>Overdue tasks: {Number(workload.overdueTaskCount ?? 0)}</li>
            <li>Blocked tasks: {Number(workload.blockedTaskCount ?? 0)}</li>
          </ul>
        ) : (
          <p className={ui.meta}>No workload data.</p>
        )}
      </section>
      <p>{String(data.bio)}</p>
      <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
        <Button type="button" disabled={busy} onClick={() => void patch({ verificationStatus: 'verified' })}>
          Mark verified
        </Button>
        <Button type="button" disabled={busy} onClick={() => void patch({ approvalStatus: 'approved' })}>
          Approve
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void patch({ approvalStatus: 'rejected' })}>
          Reject
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void patch({ approvalStatus: 'suspended' })}>
          Suspend
        </Button>
      </div>
      <section className={ui.stack} aria-labelledby="fl-services-heading">
        <h2 id="fl-services-heading" className="text-h3">
          Services &amp; base pricing
        </h2>
        {services.length === 0 ? (
          <p className={ui.meta}>No structured service offerings yet.</p>
        ) : (
          <ul className={ui.stack}>
            {services.map((s) => (
              <li key={String(s.id)} className={`surface ${ui.dataCard}`}>
                <strong>{String(s.serviceTitle)}</strong>
                {s.subServiceLabel ? <span className={ui.meta}> · {String(s.subServiceLabel)}</span> : null}
                <p className={ui.meta}>
                  {String(s.pricingTypeLabel)} · {String(s.currency)}{' '}
                  {s.basePrice ? String(s.basePrice) : '—'} ·{' '}
                  {s.isEffectivelyActive ? 'Active' : 'Inactive'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      await adminApi.freelancers.patchService(id, String(s.id), {
                        isActive: !s.isActive,
                      })
                      await servicesFetch.reload()
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  Toggle active
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={ui.stack} aria-labelledby="fl-skills-heading">
        <h2 id="fl-skills-heading" className="text-h3">
          Skills
        </h2>
        {skills.length === 0 ? (
          <p className={ui.meta}>No catalog skills selected.</p>
        ) : (
          <ul className={ui.stack}>
            {skills.map((s) => (
              <li key={String(s.id)} className={ui.meta}>
                {String(s.skillLabel)} · {String(s.serviceTitle)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={ui.stack}>
        <h2 className="text-h3">Internal notes</h2>
        <ul className={ui.stack}>
          {notes.map((n) => (
            <li key={String(n.id)} className={ui.meta}>
              {String(n.content)}
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => void addNote(e)}>
          <label>
            Add note
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </label>
          <Button type="submit" disabled={busy}>
            Save note
          </Button>
        </form>
      </section>
      <Link to={adminPortalPaths.freelancers}>Back to freelancers</Link>
    </>
  )
}

export function AdminFreelancerDiscoverPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const projectId = searchParams.get('projectId') ?? undefined
  const taskId = searchParams.get('taskId') ?? undefined
  const initialService = searchParams.get('service') ?? ''
  const canAssignProject = Boolean(profile?.permissions.includes('projects.assign'))
  const canAssignTask = Boolean(profile?.permissions.includes('tasks.update'))

  return (
    <>
      <PageIntro
        title="Discover freelancers"
        description="Internal candidate search by MUCO service, skill, availability, and workload. Assignments use existing project and task flows."
      />
      <p className={ui.meta}>
        <Link to={adminPortalPaths.freelancers}>← Freelancers</Link>
        {projectId ? (
          <>
            {' '}
            ·{' '}
            <Link to={adminPortalPaths.projectDetail(projectId)}>Back to project</Link>
          </>
        ) : null}
      </p>
      <AdminFreelancerDiscoveryPanel
        projectId={projectId}
        taskId={taskId}
        initialService={initialService}
        canAssignProject={canAssignProject && Boolean(projectId)}
        canAssignTask={canAssignTask && Boolean(projectId && taskId)}
      />
    </>
  )
}
