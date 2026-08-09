import { useState, type FormEvent } from 'react'
import { EmptyState, ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import {
  PROJECT_MEMBER_ROLES,
  presentProjectMemberRoleLabel,
} from '@/lib/projects/project-member-roles'

type ProjectFreelancer = {
  freelancerId: string
  displayName: string
  professionalRole: string
  role: string
  roleLabel: string
  activeTaskCount: number
  overdueTaskCount: number
  canRemove: boolean
}

type Candidate = {
  freelancerId: string
  displayName: string
  professionalRole: string
}

type Props = {
  projectId: string
  canAssign: boolean
  onFreelancersChange?: () => void
}

export function AdminProjectFreelancersSection({
  projectId,
  canAssign,
  onFreelancersChange,
}: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [freelancerId, setFreelancerId] = useState('')
  const [role, setRole] = useState<string>('developer')
  const [search, setSearch] = useState('')

  const { data, error, loading, reload } = useFetch(
    () => adminApi.projects.listFreelancers(projectId),
    [projectId],
  )

  const candidatesFetch = useFetch(
    () =>
      canAssign
        ? adminApi.projects.listFreelancerCandidates(projectId, search || undefined)
        : Promise.resolve({ items: [] }),
    [projectId, canAssign, search],
  )

  const freelancers = (data?.items as ProjectFreelancer[]) ?? []
  const candidates = (candidatesFetch.data?.items as Candidate[]) ?? []

  async function refreshAll() {
    await reload()
    await candidatesFetch.reload()
    onFreelancersChange?.()
  }

  async function addFreelancer(e: FormEvent) {
    e.preventDefault()
    if (!canAssign || !freelancerId) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.addFreelancer(projectId, { freelancerId, role })
      setFreelancerId('')
      setMessage('Freelancer assigned.')
      await refreshAll()
    } catch {
      setMessage('Could not assign freelancer. They may already be on the project or ineligible.')
    } finally {
      setBusy(false)
    }
  }

  async function changeRole(member: ProjectFreelancer, nextRole: string) {
    if (!canAssign || nextRole === member.role) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.updateFreelancerRole(projectId, member.freelancerId, { role: nextRole })
      setMessage('Freelancer role updated.')
      await refreshAll()
    } catch {
      setMessage('Could not update role.')
    } finally {
      setBusy(false)
    }
  }

  async function removeFreelancer(member: ProjectFreelancer) {
    if (!canAssign) return
    if (!member.canRemove) {
      setMessage('Reassign active tasks before removing this freelancer.')
      return
    }
    if (!window.confirm(`Remove ${member.displayName} from this project?`)) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.removeFreelancer(projectId, member.freelancerId)
      setMessage('Freelancer removed.')
      await refreshAll()
    } catch {
      setMessage('Could not remove freelancer. They may still have active tasks.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <ListSkeleton rows={2} />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <section className={ui.stack} aria-labelledby="admin-project-freelancers">
      <h3 id="admin-project-freelancers" className="text-h4">
        Freelancers
      </h3>
      <p className={ui.meta} role="status" aria-live="polite">
        {message}
      </p>

      {freelancers.length === 0 ? (
        <EmptyState
          title="No freelancers assigned"
          description="Assign approved freelancers from the network to deliver work on this project."
        />
      ) : (
        <ul className={ui.stack}>
          {freelancers.map((member) => (
            <li key={member.freelancerId} className={`surface ${ui.dataCard}`}>
              <div className={ui.actionsRow} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
                  <strong>{member.displayName}</strong>
                  <span className={ui.meta} style={{ marginLeft: '0.5rem' }}>
                    Freelancer
                  </span>
                  <p className={ui.meta}>
                    {member.professionalRole} · {member.roleLabel} · Active tasks{' '}
                    {member.activeTaskCount}
                    {member.overdueTaskCount > 0 ? ` · Overdue ${member.overdueTaskCount}` : ''}
                  </p>
                  {!member.canRemove ? (
                    <p className={ui.meta} role="status">
                      Reassign active tasks before removing this freelancer.
                    </p>
                  ) : null}
                </div>
                {canAssign ? (
                  <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
                    <label className={ui.field}>
                      <span className={ui.meta}>Role</span>
                      <select
                        value={
                          (PROJECT_MEMBER_ROLES as readonly string[]).includes(member.role)
                            ? member.role
                            : 'other'
                        }
                        aria-label={`Project role for ${member.displayName}`}
                        disabled={busy}
                        onChange={(e) => void changeRole(member, e.target.value)}
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
                      variant="ghost"
                      disabled={busy || !member.canRemove}
                      onClick={() => void removeFreelancer(member)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAssign ? (
        <form className={ui.form} onSubmit={(e) => void addFreelancer(e)}>
          <h4 className="text-h4">Assign freelancer</h4>
          <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
            <label className={ui.field}>
              <span>Search</span>
              <input
                type="search"
                value={search}
                placeholder="Name or role"
                aria-label="Search freelancer candidates"
                disabled={busy}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className={ui.field}>
              <span>Freelancer</span>
              <select
                value={freelancerId}
                required
                aria-label="Select freelancer"
                disabled={busy || candidates.length === 0}
                onChange={(e) => setFreelancerId(e.target.value)}
              >
                <option value="">Select freelancer</option>
                {candidates.map((c) => (
                  <option key={c.freelancerId} value={c.freelancerId}>
                    {c.displayName} ({c.professionalRole})
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.field}>
              <span>Project role</span>
              <select
                value={role}
                aria-label="Project role for freelancer"
                disabled={busy}
                onChange={(e) => setRole(e.target.value)}
              >
                {PROJECT_MEMBER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {presentProjectMemberRoleLabel(r)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button type="submit" disabled={busy || !freelancerId}>
            {busy ? 'Saving…' : 'Assign freelancer'}
          </Button>
        </form>
      ) : null}
    </section>
  )
}
