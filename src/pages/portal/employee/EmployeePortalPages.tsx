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
import styles from '@/layouts/EmployeeAppLayout.module.css'
import { employeePortalPaths, taskStatusLabels } from '@/config/employee-portal'
import { useAuth } from '@/contexts/auth-context'
import { useFetch } from '@/hooks/useFetch'
import { employeeApi } from '@/services/employee-portal'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'

export function EmployeeTasksPage() {
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(
    () => employeeApi.tasks.list({ status: status || undefined, priority: priority || undefined, q: q || undefined }),
    [status, priority, q],
  )
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="My tasks" description="Work assigned to you across projects." />
      <div className={styles.filterRow}>
        <input
          type="search"
          placeholder="Search tasks"
          aria-label="Search tasks"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Completed</option>
        </select>
        <select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No tasks" description="No tasks are currently assigned to you." />
      ) : (
        <ul className={ui.stack}>
          {items.map((task) => (
            <li key={String(task.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={employeePortalPaths.taskDetail(String(task.id))}>
                {String(task.title)}
              </Link>
              <StatusPill status={taskStatusLabels[String(task.status)] ?? String(task.status)} />
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

export function EmployeeTaskDetailPage() {
  const { id = '' } = useParams()
  const [status, setStatus] = useState('')
  const { data, error, loading, reload } = useFetch(() => employeeApi.tasks.get(id), [id])

  useEffect(() => {
    if (data?.status) setStatus(String(data.status))
  }, [data])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  async function saveStatus() {
    try {
      await employeeApi.tasks.update(id, { status })
      reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  return (
    <>
      <PageIntro title={String(data.title)} />
      <p>{data.description ? String(data.description) : null}</p>
      <StatusPill status={taskStatusLabels[String(data.status)] ?? String(data.status)} />
      <div className={ui.form} style={{ marginTop: 'var(--space-4)' }}>
        <div className={ui.field}>
          <label htmlFor="task-status">Update status</label>
          <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Completed</option>
          </select>
        </div>
        <Button type="button" onClick={() => void saveStatus()}>
          Save
        </Button>
      </div>
    </>
  )
}

export function EmployeeProjectsPage() {
  const { data, error, loading, reload } = useFetch(() => employeeApi.projects.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Projects" description="Assignments you are authorized to work on." />
      {items.length === 0 ? (
        <EmptyState title="No projects" description="You don't have any active project assignments." />
      ) : (
        <ul className={ui.stack}>
          {items.map((p) => (
            <li key={String(p.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={employeePortalPaths.projectDetail(String(p.id))}>
                {String(p.name)}
              </Link>
              <span className={ui.meta}>{String(p.customerCompany ?? 'Client')}</span>
              <StatusPill status={String(p.status)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function EmployeeProjectDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => employeeApi.projects.get(id), [id])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const project = data.project as Record<string, unknown>
  const milestones = (data.milestones as Array<Record<string, unknown>>) ?? []
  const tasks = (data.tasks as Array<Record<string, unknown>>) ?? []
  const team = (data.team as Array<Record<string, unknown>>) ?? []

  return (
    <>
      <PageIntro title={String(project.name)} description={String(data.customerCompany ?? '')} />
      <StatusPill status={String(project.status)} />
      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h3">Milestones</h2>
        {milestones.length === 0 ? (
          <p className={ui.meta}>No milestones yet.</p>
        ) : (
          <ol className={ui.timeline}>
            {milestones.map((m) => (
              <li key={String(m.id)}>
                {String(m.name)} <StatusPill status={String(m.status)} />
              </li>
            ))}
          </ol>
        )}
      </section>
      <section style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Team</h2>
        <ul className={ui.stack}>
          {team.map((member, index) => (
            <li key={index} className={ui.meta}>
              {String(member.displayName)} — {String(member.role)}
            </li>
          ))}
        </ul>
      </section>
      <section style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Tasks</h2>
        <ul className={ui.stack}>
          {tasks.map((t) => (
            <li key={String(t.id)} className={ui.meta}>
              {String(t.title)} — <StatusPill status={String(t.status)} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export function EmployeeFilesPage() {
  const { data, error, loading, reload } = useFetch(() => employeeApi.files.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  async function download(fileId: string) {
    const result = (await employeeApi.files.download(fileId)) as { configured?: boolean; url?: string }
    if (result.configured && result.url) window.open(result.url, '_blank', 'noopener,noreferrer')
    else alert('Download unavailable.')
  }

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Files" description="Project files you can access." />
      {items.length === 0 ? (
        <EmptyState title="No files" description="No project files are available yet." />
      ) : (
        <ul className={ui.stack}>
          {items.map((f) => (
            <li key={String(f.id)} className={`surface ${ui.dataCard}`}>
              <button type="button" className="link-underline" onClick={() => void download(String(f.id))}>
                {String(f.fileName)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function EmployeeMessagesPage() {
  const [body, setBody] = useState('')
  const { data, error, loading, reload } = useFetch(() => employeeApi.messages.list(), [])

  async function send(e: FormEvent) {
    e.preventDefault()
    await employeeApi.messages.send({ body })
    setBody('')
    reload()
  }

  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Messages" />
      <form className={ui.form} onSubmit={(e) => void send(e)}>
        <div className={ui.field}>
          <label htmlFor="emp-msg">Message</label>
          <textarea id="emp-msg" value={body} onChange={(e) => setBody(e.target.value)} required />
        </div>
        <Button type="submit">Send</Button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="No messages yet" description="No messages yet." />
      ) : (
        <div className={ui.messageList}>
          {items.map((m) => (
            <article key={String(m.id)} className={ui.messageItem}>
              <p>{String(m.body)}</p>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

export function EmployeeNotificationsPage() {
  const { data, error, loading, reload } = useFetch(() => employeeApi.notifications.list(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Notifications" />
      {items.length === 0 ? (
        <EmptyState title="You're all caught up" description="No notifications yet." />
      ) : (
        <ul className={ui.stack}>
          {items.map((n) => (
            <li key={String(n.id)} className={`surface ${ui.dataCard}`}>
              <strong>{String(n.title)}</strong>
              <p className={ui.meta}>{String(n.message)}</p>
              {!n.read ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void employeeApi.notifications.markRead(String(n.id)).then(reload)}
                >
                  Mark read
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function EmployeeDeadlinesPage() {
  const { data, error, loading, reload } = useFetch(() => employeeApi.deadlines(), [])
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Deadlines" description="Upcoming task and milestone dates." />
      {items.length === 0 ? (
        <EmptyState title="No upcoming deadlines" description="Dates will appear when tasks or milestones are scheduled." />
      ) : (
        <ul className={ui.stack}>
          {items.map((item) => (
            <li key={String(item.id)} className={`surface ${ui.dataCard}`}>
              <strong>{String(item.title)}</strong>
              <span className={ui.meta}>{String(item.kind)}</span>
              {item.dueDate ? (
                <time dateTime={String(item.dueDate)}>
                  {new Date(String(item.dueDate)).toLocaleString()}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function EmployeeProfilePage() {
  const { data, error, loading, reload } = useFetch(() => employeeApi.profile.get(), [])
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  useEffect(() => {
    if (!data) return
    setFullName(String(data.fullName ?? ''))
    setDepartment(String(data.department ?? ''))
    setJobTitle(String(data.jobTitle ?? ''))
  }, [data])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  async function save(e: FormEvent) {
    e.preventDefault()
    await employeeApi.profile.update({ fullName, department, jobTitle })
    reload()
  }

  return (
    <>
      <PageIntro title="Profile" />
      <p className={ui.meta}>Work email: {String(data?.email)}</p>
      <form className={ui.form} onSubmit={(e) => void save(e)}>
        <div className={ui.field}>
          <label htmlFor="emp-name">Name</label>
          <input id="emp-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className={ui.field}>
          <label htmlFor="emp-dept">Department</label>
          <input id="emp-dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div className={ui.field}>
          <label htmlFor="emp-title">Job title</label>
          <input id="emp-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </>
  )
}

export function EmployeeSettingsPage() {
  const { profile } = useAuth()
  return (
    <>
      <PageIntro title="Settings" />
      <div className={`surface ${ui.dataCard}`}>
        <p className={ui.meta}>Signed in as {profile?.email}</p>
        <Link className="link-underline" to="/auth/forgot-password">
          Reset password via email
        </Link>
      </div>
    </>
  )
}
