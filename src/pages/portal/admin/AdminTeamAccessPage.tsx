import { PageIntro, ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { friendlyAdminPortalError } from '@/lib/admin/portal-errors'

type AccessRow = {
  employeeId: string
  email: string
  fullName: string | null
  userStatus: string
  department: string | null
  departmentLabel: string | null
  employmentState: string
  roles: string[]
  permissions: string[]
  projectCount: number
  openTaskCount: number
}

export function AdminTeamAccessPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.employees.accessReview(), [])

  if (loading) return <ListSkeleton rows={10} />
  if (error) return <PortalError message={friendlyAdminPortalError(error)} onRetry={reload} />

  const items = (data?.items as AccessRow[]) ?? []

  return (
    <>
      <PageIntro
        label="People & security"
        title="Team access review"
        description="Roles and permissions from the database — use this to prevent privilege creep. No fabricated org chart."
      />
      {items.length === 0 ? (
        <p className={ui.meta}>No employees yet.</p>
      ) : (
        <ul className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          {items.map((row) => (
            <li key={row.employeeId} className={`surface ${ui.dataCard}`}>
              <strong>{row.fullName ?? row.email}</strong>
              <span className={ui.meta}>
                {row.email} · {row.userStatus} · {row.employmentState}
                {row.departmentLabel ? ` · ${row.departmentLabel}` : ''}
              </span>
              <p className={ui.meta}>
                Roles: {row.roles.join(', ') || '—'}
                <br />
                Projects: {row.projectCount} · Open tasks: {row.openTaskCount}
              </p>
              <details>
                <summary className={ui.meta}>Permissions ({row.permissions.length})</summary>
                <p className={ui.meta} style={{ wordBreak: 'break-word' }}>
                  {row.permissions.join(', ') || '—'}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
      <p className={ui.meta} style={{ marginTop: 'var(--space-4)' }}>
        <button type="button" className="link-underline" onClick={() => reload()}>
          Refresh
        </button>
      </p>
    </>
  )
}
