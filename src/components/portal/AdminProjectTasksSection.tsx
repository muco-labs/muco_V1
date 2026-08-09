import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState, ListSkeleton, PortalError, StatusPill } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'

type MilestoneOption = { id: string; name: string }
type MemberOption = { employeeId: string; displayName: string }
type FreelancerOption = { freelancerId: string; displayName: string }

type AdminProjectTask = {
  id: string
  reference: string
  title: string
  description: string | null
  milestoneId: string | null
  milestoneName: string | null
  status: string
  statusLabel: string
  priority: string
  assigneeEmployeeId: string | null
  assigneeFreelancerId?: string | null
  assigneeName: string | null
  dueDate: string | null
  overdue: boolean
  updatedAt: string
}

function assigneeSelectValue(task: AdminProjectTask): string {
  if (task.assigneeFreelancerId) return `f:${task.assigneeFreelancerId}`
  if (task.assigneeEmployeeId) return `e:${task.assigneeEmployeeId}`
  return ''
}

function parseAssigneeSelect(value: string): Record<string, string | null> {
  if (!value) return { assignedEmployeeId: null, assignedFreelancerId: null }
  if (value.startsWith('f:')) {
    return { assignedEmployeeId: null, assignedFreelancerId: value.slice(2) }
  }
  if (value.startsWith('e:')) {
    return { assignedEmployeeId: value.slice(2), assignedFreelancerId: null }
  }
  return { assignedEmployeeId: value, assignedFreelancerId: null }
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'blocked', 'done', 'cancelled'] as const
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const

type Props = {
  projectId: string
  canCreate: boolean
  canManage: boolean
  milestones: MilestoneOption[]
  members: MemberOption[]
  freelancers: FreelancerOption[]
}

export function AdminProjectTasksSection({
  projectId,
  canCreate,
  canManage,
  milestones,
  members,
  freelancers,
}: Props) {
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [milestoneFilter, setMilestoneFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newMilestoneId, setNewMilestoneId] = useState('')
  const [newAssigneeId, setNewAssigneeId] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')

  const filterKey = useMemo(
    () =>
      [statusFilter, priorityFilter, milestoneFilter, assigneeFilter, overdueOnly].join('|'),
    [statusFilter, priorityFilter, milestoneFilter, assigneeFilter, overdueOnly],
  )

  const { data, error, loading, reload } = useFetch(
    () =>
      adminApi.projects.listTasks(projectId, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        milestoneId: milestoneFilter || undefined,
        assigneeEmployeeId: assigneeFilter || undefined,
        overdueOnly: overdueOnly || undefined,
      }),
    [projectId, filterKey],
  )

  const items = (data?.items as AdminProjectTask[]) ?? []

  async function createTask(e: FormEvent) {
    e.preventDefault()
    if (!canCreate || !title.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        milestoneId: newMilestoneId || undefined,
        ...parseAssigneeSelect(newAssigneeId),
        priority: newPriority,
        dueDate: newDueDate || undefined,
      })
      setTitle('')
      setDescription('')
      setNewMilestoneId('')
      setNewAssigneeId('')
      setNewDueDate('')
      setMessage('Task created.')
      reload()
    } catch {
      setMessage('Could not create task.')
    } finally {
      setBusy(false)
    }
  }

  async function patchTask(taskId: string, body: Record<string, unknown>) {
    if (!canManage) return
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.projects.updateTask(projectId, taskId, body)
      setMessage('Task updated.')
      reload()
    } catch {
      setMessage('Could not update task.')
    } finally {
      setBusy(false)
    }
  }

  async function completeTask(taskId: string) {
    if (!canManage) return
    setBusy(true)
    try {
      await adminApi.projects.completeTask(projectId, taskId)
      setMessage('Task completed.')
      reload()
    } catch {
      setMessage('Could not complete task.')
    } finally {
      setBusy(false)
    }
  }

  async function cancelTask(taskId: string) {
    if (!canManage || !window.confirm('Cancel this task?')) return
    setBusy(true)
    try {
      await adminApi.projects.cancelTask(projectId, taskId)
      setMessage('Task cancelled.')
      reload()
    } catch {
      setMessage('Could not cancel task.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <ListSkeleton rows={4} />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }} aria-labelledby="admin-project-tasks">
      <h2 id="admin-project-tasks" className="text-h3">
        Tasks
      </h2>
      <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
        <label className={ui.field}>
          <span className={ui.meta}>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          <span className={ui.meta}>Priority</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          <span className={ui.meta}>Milestone</span>
          <select
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            aria-label="Filter by milestone"
          >
            <option value="">All</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          <span className={ui.meta}>Assignee</span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            aria-label="Filter by assignee"
          >
            <option value="">All</option>
            {members.map((m) => (
              <option key={m.employeeId} value={m.employeeId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          <span className={ui.meta}>Overdue only</span>
        </label>
      </div>

      <p className={ui.meta} role="status" aria-live="polite">
        {message}
      </p>

      {items.length === 0 ? (
        <EmptyState title="No tasks" description="Create tasks to track delivery work on this project." />
      ) : (
        <ul className={ui.stack}>
          {items.map((task) => (
            <li key={task.id} className={`surface ${ui.dataCard}`}>
              <div className={ui.actionsRow} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
                  <strong style={{ wordBreak: 'break-word' }}>{task.title}</strong>
                  <p className={ui.meta}>
                    {task.reference}
                    {task.milestoneName ? ` · ${task.milestoneName}` : ''}
                    {task.assigneeName ? ` · ${task.assigneeName}` : ' · Unassigned'}
                  </p>
                  {task.overdue ? (
                    <p className={ui.meta} role="status">
                      <strong>Overdue</strong>
                      {task.dueDate
                        ? ` · due ${new Date(task.dueDate).toLocaleDateString()}`
                        : ''}
                    </p>
                  ) : task.dueDate ? (
                    <p className={ui.meta}>Due {new Date(task.dueDate).toLocaleDateString()}</p>
                  ) : null}
                  <p className={ui.meta}>Updated {new Date(task.updatedAt).toLocaleString()}</p>
                </div>
                <StatusPill status={task.status} />
                <span className={ui.meta} aria-label={`Priority ${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              {canManage && task.status !== 'done' && task.status !== 'cancelled' ? (
                <div className={ui.actionsRow} style={{ flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                  <label className={ui.field}>
                    <span className={ui.meta}>Status</span>
                    <select
                      value={task.status}
                      aria-label={`Status for ${task.title}`}
                      disabled={busy}
                      onChange={(e) => void patchTask(task.id, { status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={ui.field}>
                    <span className={ui.meta}>Assignee</span>
                    <select
                      value={assigneeSelectValue(task)}
                      aria-label={`Assignee for ${task.title}`}
                      disabled={busy}
                      onChange={(e) => void patchTask(task.id, parseAssigneeSelect(e.target.value))}
                    >
                      <option value="">Unassigned</option>
                      {members.length ? (
                        <optgroup label="Employees">
                          {members.map((m) => (
                            <option key={m.employeeId} value={`e:${m.employeeId}`}>
                              {m.displayName}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {freelancers.length ? (
                        <optgroup label="Freelancers">
                          {freelancers.map((m) => (
                            <option key={m.freelancerId} value={`f:${m.freelancerId}`}>
                              {m.displayName}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                  </label>
                  <Button type="button" disabled={busy} onClick={() => void completeTask(task.id)}>
                    Complete
                  </Button>
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => void cancelTask(task.id)}>
                    Cancel
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canCreate ? (
        <form className={ui.form} onSubmit={(e) => void createTask(e)}>
          <h3 className="text-h4">New task</h3>
          <div className={ui.field}>
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className={ui.field}>
            <label htmlFor="task-desc">Description (optional)</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={8000}
              rows={3}
            />
          </div>
          <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
            <label className={ui.field}>
              <span>Milestone</span>
              <select
                value={newMilestoneId}
                onChange={(e) => setNewMilestoneId(e.target.value)}
                aria-label="Milestone for new task"
              >
                <option value="">None</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.field}>
              <span>Assignee</span>
              <select
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                aria-label="Assignee for new task"
              >
                <option value="">Unassigned</option>
                {members.length ? (
                  <optgroup label="Employees">
                    {members.map((m) => (
                      <option key={m.employeeId} value={`e:${m.employeeId}`}>
                        {m.displayName}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {freelancers.length ? (
                  <optgroup label="Freelancers">
                    {freelancers.map((m) => (
                      <option key={m.freelancerId} value={`f:${m.freelancerId}`}>
                        {m.displayName}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </label>
            <label className={ui.field}>
              <span>Priority</span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                aria-label="Priority for new task"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.field}>
              <span>Due date</span>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                aria-label="Due date for new task"
              />
            </label>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Add task'}
          </Button>
        </form>
      ) : null}
    </section>
  )
}
