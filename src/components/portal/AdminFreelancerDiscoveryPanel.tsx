import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { adminPortalPaths } from '@/config/admin-portal'
import {
  PROJECT_MEMBER_ROLES,
  presentProjectMemberRoleLabel,
} from '@/lib/projects/project-member-roles'

type CatalogService = {
  slug: string
  title: string
  subServices: Array<{ id: string; label: string }>
}

type DiscoveryCandidate = {
  freelancerId: string
  reference: string
  displayName: string
  professionalRole: string
  approvalStatus: string
  availabilityStatus: string
  availabilityStatusLabel: string
  matchSummary: string
  reasons: string[]
  serviceMatch: boolean
  skillMatch: boolean | null
  workload: {
    activeProjectCount: number
    activeTaskCount: number
    overdueTaskCount: number
    blockedTaskCount: number
  }
  pricing: {
    pricingTypeLabel: string
    basePrice: string | null
    currency: string
    serviceTitle: string
  } | null
  assignment: {
    onProject: boolean
    projectRole: string | null
    currentTaskAssignee: boolean
    canAssignToProject: boolean
    canAssignToTask: boolean
  }
}

type Props = {
  projectId?: string
  taskId?: string
  initialService?: string
  canAssignProject: boolean
  canAssignTask: boolean
  onAssigned?: () => void
}

export function AdminFreelancerDiscoveryPanel({
  projectId,
  taskId,
  initialService = '',
  canAssignProject,
  canAssignTask,
  onAssigned,
}: Props) {
  const [service, setService] = useState(initialService)
  const [skill, setSkill] = useState('')
  const [q, setQ] = useState('')
  const [availability, setAvailability] = useState('')
  const [projectRole, setProjectRole] = useState('developer')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const catalogFetch = useFetch(() => adminApi.freelancers.serviceCatalog(), [])
  const catalog = (catalogFetch.data?.items as CatalogService[]) ?? []
  const selectedCatalog = catalog.find((c) => c.slug === service)

  const queryKey = useMemo(
    () => [projectId, taskId, service, skill, q, availability].join('|'),
    [projectId, taskId, service, skill, q, availability],
  )

  const { data, error, loading, reload } = useFetch(
    () =>
      adminApi.freelancers.discover({
        projectId,
        taskId,
        service: service || undefined,
        skill: skill || undefined,
        q: q || undefined,
        availability: availability || undefined,
      }),
    [queryKey],
  )

  const items = (data?.items as DiscoveryCandidate[]) ?? []
  const context = data?.context as Record<string, unknown> | undefined
  const hint = data?.hint as string | undefined

  async function assignProject(candidate: DiscoveryCandidate) {
    if (!projectId || !canAssignProject) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.addFreelancer(projectId, {
        freelancerId: candidate.freelancerId,
        role: projectRole,
      })
      setMessage(`${candidate.displayName} assigned to project.`)
      onAssigned?.()
      await reload()
    } catch {
      setMessage('Could not assign to project. Check eligibility and availability.')
    } finally {
      setBusy(false)
    }
  }

  async function assignTask(candidate: DiscoveryCandidate) {
    if (!projectId || !taskId || !canAssignTask) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.updateTask(projectId, taskId, {
        assignedFreelancerId: candidate.freelancerId,
      })
      setMessage(`${candidate.displayName} assigned to task.`)
      onAssigned?.()
      await reload()
    } catch {
      setMessage('Could not assign task. Freelancer must be on the project and available.')
    } finally {
      setBusy(false)
    }
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    void reload()
  }

  if (catalogFetch.loading) return <ListSkeleton rows={2} />
  if (catalogFetch.error) return <PortalError message={catalogFetch.error} onRetry={catalogFetch.reload} />

  return (
    <section className={ui.stack} aria-labelledby="fl-discover-heading">
      <h2 id="fl-discover-heading" className="text-h3">
        Find freelancer
      </h2>
      {context?.projectName ? (
        <p className={ui.meta}>
          Project: {String(context.projectName)}
          {context.derivedServiceTitle
            ? ` · Service: ${String(context.derivedServiceTitle)}`
            : null}
          {context.taskTitle ? ` · Task: ${String(context.taskTitle)}` : null}
        </p>
      ) : null}

      <form className={ui.form} onSubmit={(e) => void onSearch(e)}>
        <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
          <label className={ui.field}>
            <span>MUCO service</span>
            <select
              value={service}
              aria-label="Service filter"
              onChange={(e) => {
                setService(e.target.value)
                setSkill('')
              }}
            >
              <option value="">Any / derive from project</option>
              {catalog.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          {selectedCatalog && selectedCatalog.subServices.length > 0 ? (
            <label className={ui.field}>
              <span>Skill (optional)</span>
              <select value={skill} aria-label="Skill filter" onChange={(e) => setSkill(e.target.value)}>
                <option value="">Any skill</option>
                {selectedCatalog.subServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className={ui.field}>
            <span>Availability</span>
            <select
              value={availability}
              aria-label="Availability filter"
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="">Available or limited</option>
              <option value="available">Available only</option>
              <option value="limited">Limited only</option>
            </select>
          </label>
          <label className={ui.field}>
            <span>Search</span>
            <input
              type="search"
              value={q}
              placeholder="Name or role"
              aria-label="Search freelancers"
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        <Button type="submit" disabled={loading}>
          Search candidates
        </Button>
      </form>

      <p className={ui.meta} role="status" aria-live="polite">
        {message}
      </p>

      {loading ? <ListSkeleton rows={3} /> : null}
      {error ? <PortalError message={error} onRetry={reload} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No candidates"
          description={
            hint ?? 'Adjust service, skill, or search. Unavailable freelancers are excluded from new assignments.'
          }
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className={ui.stack}>
          {items.map((c) => (
            <li key={c.freelancerId} className={`surface ${ui.dataCard}`}>
              <strong>{c.displayName}</strong>
              <span className={ui.meta}> · {c.reference}</span>
              <p className={ui.meta}>
                {c.professionalRole} · {c.availabilityStatusLabel} · {c.matchSummary}
              </p>
              <p className={ui.meta}>
                Projects {c.workload.activeProjectCount} · Tasks {c.workload.activeTaskCount}
                {c.workload.overdueTaskCount > 0 ? ` · Overdue ${c.workload.overdueTaskCount}` : ''}
                {c.workload.blockedTaskCount > 0 ? ` · Blocked ${c.workload.blockedTaskCount}` : ''}
              </p>
              {c.pricing ? (
                <p className={ui.meta}>
                  {c.pricing.serviceTitle} · {c.pricing.pricingTypeLabel}
                  {c.pricing.basePrice
                    ? ` · ${c.pricing.currency} ${c.pricing.basePrice}`
                    : ''}{' '}
                  (internal)
                </p>
              ) : null}
              {c.reasons.length > 0 ? (
                <p className={ui.meta}>
                  <span className="sr-only">Match signals: </span>
                  {c.reasons.join(' · ')}
                </p>
              ) : null}
              <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
                <Link
                  className="link-underline"
                  to={adminPortalPaths.freelancerDetail(c.freelancerId)}
                >
                  View profile
                </Link>
                {c.assignment.onProject ? (
                  <span className={ui.meta}>Already on project</span>
                ) : canAssignProject && projectId ? (
                  <>
                    <label className={ui.field}>
                      <span className={ui.meta}>Role</span>
                      <select
                        value={projectRole}
                        aria-label={`Project role for ${c.displayName}`}
                        onChange={(e) => setProjectRole(e.target.value)}
                      >
                        {PROJECT_MEMBER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {presentProjectMemberRoleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      type="button"
                      disabled={busy || !c.assignment.canAssignToProject}
                      onClick={() => void assignProject(c)}
                    >
                      Assign to project
                    </Button>
                  </>
                ) : null}
                {taskId && c.assignment.currentTaskAssignee ? (
                  <span className={ui.meta}>Currently assigned</span>
                ) : taskId && canAssignTask ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy || !c.assignment.canAssignToTask}
                    onClick={() => void assignTask(c)}
                  >
                    Assign to task
                  </Button>
                ) : null}
                {taskId && !c.assignment.onProject && canAssignTask ? (
                  <span className={ui.meta}>Add to project before task assignment</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
