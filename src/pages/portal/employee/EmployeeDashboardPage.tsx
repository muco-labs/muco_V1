import { Link } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PageIntro,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { employeePortalPaths } from '@/config/employee-portal'
import { useFetch } from '@/hooks/useFetch'
import { employeeApi } from '@/services/employee-portal'

export function EmployeeDashboardPage() {
  const { data, error, loading, reload } = useFetch(() => employeeApi.dashboard(), [])

  if (loading) return <ListSkeleton rows={5} />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const myTasks = (data.myTasks as Array<Record<string, unknown>>) ?? []
  const assignedProjects = (data.assignedProjects as Array<Record<string, unknown>>) ?? []
  const recentNotifications = (data.recentNotifications as Array<Record<string, unknown>>) ?? []

  return (
    <>
      <PageIntro
        label="Workspace"
        title={`Welcome, ${String(data.welcomeName)}`}
        description="Today's assignments and project updates."
      />
      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Today's work</h2>
          {myTasks.length === 0 ? (
            <EmptyState title="You're all caught up" description="No tasks are currently assigned to you." />
          ) : (
            <ul className={ui.stack}>
              {myTasks.map((task) => (
                <li key={String(task.id)}>
                  <Link className="link-underline" to={employeePortalPaths.taskDetail(String(task.id))}>
                    {String(task.title)}
                  </Link>
                  <StatusPill status={String(task.status)} />
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Active projects</h2>
          {assignedProjects.length === 0 ? (
            <EmptyState
              title="No project assignments"
              description="You don't have any active project assignments."
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
      {recentNotifications.length > 0 ? (
        <p className={ui.meta} style={{ marginTop: 'var(--space-6)' }}>
          <Link className="link-underline" to={employeePortalPaths.notifications}>
            View notifications
          </Link>
        </p>
      ) : null}
    </>
  )
}
