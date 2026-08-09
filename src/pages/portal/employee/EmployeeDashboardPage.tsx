import { Link } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PageIntro,
  PortalAttention,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { employeePortalPaths, taskStatusLabels } from '@/config/employee-portal'
import { useFetch } from '@/hooks/useFetch'
import { employeeApi } from '@/services/employee-portal'
import { friendlyEmployeePortalError, taskStatusTone } from '@/lib/employee/portal-errors'
import dash from './EmployeeDashboardPage.module.css'

export function EmployeeDashboardPage() {
  const { data, error, loading, reload } = useFetch(() => employeeApi.dashboard(), [])

  if (loading) return <ListSkeleton rows={5} />
  if (error) return <PortalError message={friendlyEmployeePortalError(error)} onRetry={reload} />
  if (!data) return null

  const myTasks = (data.myTasks as Array<Record<string, unknown>>) ?? []
  const dueSoonTasks = (data.dueSoonTasks as Array<Record<string, unknown>>) ?? []
  const blockedTasks = (data.blockedTasks as Array<Record<string, unknown>>) ?? []
  const assignedProjects = (data.assignedProjects as Array<Record<string, unknown>>) ?? []
  const unreadNotifications = Number(data.unreadNotificationCount ?? 0)
  const needsAttention = blockedTasks.length > 0 || dueSoonTasks.length > 0 || unreadNotifications > 0

  return (
    <>
      {needsAttention ? (
        <PortalAttention
          title={
            blockedTasks.length > 0
              ? `${blockedTasks.length} blocked task${blockedTasks.length === 1 ? '' : 's'} need attention`
              : dueSoonTasks.length > 0
                ? `${dueSoonTasks.length} task${dueSoonTasks.length === 1 ? '' : 's'} due within 7 days`
                : `${unreadNotifications} unread notification${unreadNotifications === 1 ? '' : 's'}`
          }
          description="Review tasks, deadlines, and notifications below."
        >
          {blockedTasks.length > 0 ? (
            <Link className="link-underline" to={employeePortalPaths.tasks}>
              View blocked tasks
            </Link>
          ) : null}
          {dueSoonTasks.length > 0 ? (
            <Link className="link-underline" to={employeePortalPaths.deadlines}>
              View deadlines
            </Link>
          ) : null}
          {unreadNotifications > 0 ? (
            <Link className="link-underline" to={employeePortalPaths.notifications}>
              Open notifications
            </Link>
          ) : null}
        </PortalAttention>
      ) : null}

      <PageIntro
        label="Workspace"
        title={`Welcome, ${String(data.welcomeName)}`}
        description="Your assignments, projects, and next actions."
      />
      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <div className={dash.sectionHead}>
            <h2 className="text-h3">Active tasks</h2>
            <Link className="link-underline" to={employeePortalPaths.tasks}>
              View all
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState title="You're all caught up" description="No open tasks are assigned to you right now." />
          ) : (
            <ul className={ui.stack}>
              {myTasks.map((task) => (
                <li key={String(task.id)}>
                  <Link className="link-underline" to={employeePortalPaths.taskDetail(String(task.id))}>
                    {String(task.title)}
                  </Link>
                  <StatusPill
                    status={taskStatusLabels[String(task.status)] ?? String(task.status)}
                    tone={taskStatusTone(String(task.status))}
                  />
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Due soon</h2>
          {dueSoonTasks.length === 0 ? (
            <p className={ui.meta}>No tasks due in the next 7 days.</p>
          ) : (
            <ul className={ui.stack}>
              {dueSoonTasks.map((task) => (
                <li key={String(task.id)}>
                  <Link className="link-underline" to={employeePortalPaths.taskDetail(String(task.id))}>
                    {String(task.title)}
                  </Link>
                  {task.dueDate ? (
                    <time className={ui.meta} dateTime={String(task.dueDate)}>
                      Due {new Date(String(task.dueDate)).toLocaleDateString()}
                    </time>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Blocked</h2>
          {blockedTasks.length === 0 ? (
            <p className={ui.meta}>No blocked tasks.</p>
          ) : (
            <ul className={ui.stack}>
              {blockedTasks.map((task) => (
                <li key={String(task.id)}>
                  <Link className="link-underline" to={employeePortalPaths.taskDetail(String(task.id))}>
                    {String(task.title)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <div className={dash.sectionHead}>
            <h2 className="text-h3">Projects</h2>
            <Link className="link-underline" to={employeePortalPaths.projects}>
              View all
            </Link>
          </div>
          {assignedProjects.length === 0 ? (
            <EmptyState
              title="No project assignments"
              description="Projects you join will appear here."
            />
          ) : (
            <ul className={ui.stack}>
              {assignedProjects.map((p) => (
                <li key={String(p.id)}>
                  <Link className="link-underline" to={employeePortalPaths.projectDetail(String(p.id))}>
                    {String(p.name)}
                  </Link>
                  <StatusPill status={String(p.status)} />
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
      {unreadNotifications > 0 ? (
        <p className={ui.meta} style={{ marginTop: 'var(--space-6)' }}>
          <Link className="link-underline" to={employeePortalPaths.notifications}>
            {unreadNotifications} unread notification{unreadNotifications === 1 ? '' : 's'}
          </Link>
        </p>
      ) : null}
    </>
  )
}
