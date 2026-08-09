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

type ProjectMember = {
  employeeId: string
  displayName: string
  role: string
  roleLabel: string
  activeTaskCount: number
  overdueTaskCount: number
  canRemove: boolean
  employmentState?: string
  userStatus?: string
}

type Candidate = {
  employeeId: string
  displayName: string
}

type Props = {
  projectId: string
  canAssign: boolean
  onMembersChange?: () => void
}

export function AdminProjectTeamSection({ projectId, canAssign, onMembersChange }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [role, setRole] = useState<string>('developer')

  const { data, error, loading, reload } = useFetch(
    () => adminApi.projects.listMembers(projectId),
    [projectId],
  )

  const candidatesFetch = useFetch(
    () => (canAssign ? adminApi.projects.listMemberCandidates(projectId) : Promise.resolve({ items: [] })),
    [projectId, canAssign],
  )

  const members = (data?.items as ProjectMember[]) ?? []
  const candidates = (candidatesFetch.data?.items as Candidate[]) ?? []

  async function refreshAll() {
    await reload()
    await candidatesFetch.reload()
    onMembersChange?.()
  }

  async function addMember(e: FormEvent) {
    e.preventDefault()
    if (!canAssign || !employeeId) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.addMember(projectId, { employeeId, role })
      setEmployeeId('')
      setMessage('Team member added.')
      await refreshAll()
    } catch {
      setMessage('Could not add team member. They may already be on the project.')
    } finally {
      setBusy(false)
    }
  }

  async function changeRole(member: ProjectMember, nextRole: string) {
    if (!canAssign || nextRole === member.role) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.updateMemberRole(projectId, member.employeeId, { role: nextRole })
      setMessage('Role updated.')
      await refreshAll()
    } catch {
      setMessage('Could not update role.')
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(member: ProjectMember) {
    if (!canAssign) return
    if (!member.canRemove) {
      setMessage('Reassign active tasks before removing this member.')
      return
    }
    if (!window.confirm(`Remove ${member.displayName} from this project?`)) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.removeMember(projectId, member.employeeId)
      setMessage('Team member removed.')
      await refreshAll()
    } catch {
      setMessage('Could not remove member. They may still have active tasks.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <ListSkeleton rows={3} />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }} aria-labelledby="admin-project-team">
      <h2 id="admin-project-team" className="text-h3">
        Team
      </h2>
      <p className={ui.meta} role="status" aria-live="polite">
        {message}
      </p>

      {members.length === 0 ? (
        <EmptyState title="No team members" description="Add employees who will deliver this project." />
      ) : (
        <ul className={ui.stack}>
          {members.map((member) => (
            <li key={member.employeeId} className={`surface ${ui.dataCard}`}>
              <div className={ui.actionsRow} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
                  <strong>{member.displayName}</strong>
                  <p className={ui.meta}>
                    {member.roleLabel} · Active tasks {member.activeTaskCount}
                    {member.overdueTaskCount > 0
                      ? ` · Overdue ${member.overdueTaskCount}`
                      : ''}
                  </p>
                  {!member.canRemove ? (
                    <p className={ui.meta} role="status">
                      Reassign active tasks before removing this member.
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
                        aria-label={`Role for ${member.displayName}`}
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
                      onClick={() => void removeMember(member)}
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
        <form className={ui.form} onSubmit={(e) => void addMember(e)}>
          <h3 className="text-h4">Add team member</h3>
          <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
            <label className={ui.field}>
              <span>Employee</span>
              <select
                value={employeeId}
                required
                aria-label="Select employee to add"
                disabled={busy || candidates.length === 0}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Select employee</option>
                {candidates.map((c) => (
                  <option key={c.employeeId} value={c.employeeId}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.field}>
              <span>Project role</span>
              <select
                value={role}
                aria-label="Project role for new member"
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
          <Button type="submit" disabled={busy || !employeeId}>
            {busy ? 'Saving…' : 'Add member'}
          </Button>
        </form>
      ) : null}
    </section>
  )
}
