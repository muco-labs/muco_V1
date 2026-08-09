import { Link } from 'react-router-dom'
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

function formatInr(amount: string) {
  const n = Number.parseFloat(amount)
  if (Number.isNaN(n)) return `₹${amount}`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
}

export function AdminDashboardPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.dashboard(), [])

  if (loading) return <ListSkeleton rows={6} />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const activity = data.recentActivity ?? []

  return (
    <>
      <PageIntro
        label="Control center"
        title="Business overview"
        description="Live metrics from your database. Empty sections mean no records yet — not placeholder data."
      />

      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">New leads</h2>
          <p className="text-h2">{data.leadsNew}</p>
          Manage in{' '}
          <Link className="link-underline" to={adminPortalPaths.crm}>
            CRM
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Qualified leads</h2>
          <p className="text-h2">{data.qualifiedLeads}</p>
          <Link className="link-underline" to={adminPortalPaths.crm}>
            Pipeline
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Active projects</h2>
          <p className="text-h2">{data.activeProjects}</p>
          <p className={ui.meta}>
            Planning {data.planningProjects ?? 0} · On hold {data.onHoldProjects ?? 0}
          </p>
          <Link className="link-underline" to={adminPortalPaths.projects}>
            View projects
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Customers</h2>
          <p className="text-h2">{data.customers}</p>
          <Link className="link-underline" to={adminPortalPaths.customers}>
            View customers
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Employees</h2>
          <p className="text-h2">{data.employees}</p>
          <Link className="link-underline" to={adminPortalPaths.employees}>
            Manage team
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Outstanding invoices</h2>
          <p className="text-h2">{formatInr(data.outstandingInvoicesTotal)}</p>
          <Link className="link-underline" to={adminPortalPaths.invoices}>
            Invoices
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Revenue (paid)</h2>
          <p className="text-h2">{formatInr(data.revenueSucceeded)}</p>
          <Link className="link-underline" to={adminPortalPaths.payments}>
            Payments
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Open support</h2>
          <p className="text-h2">{data.openSupportTickets}</p>
          <Link className="link-underline" to={adminPortalPaths.support}>
            Support queue
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Pending proposals</h2>
          <p className="text-h2">{data.pendingProposals}</p>
          <Link className="link-underline" to={adminPortalPaths.proposals}>
            Proposals
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Open tasks</h2>
          <p className="text-h2">{data.openTasks}</p>
          <Link className="link-underline" to={adminPortalPaths.tasks}>
            Tasks
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Tasks due (7 days)</h2>
          <p className="text-h2">{data.tasksDueSoon}</p>
          <Link className="link-underline" to={adminPortalPaths.operations}>
            Operations
          </Link>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Overdue invoices</h2>
          <p className="text-h2">{data.overdueInvoices}</p>
          <Link className="link-underline" to={adminPortalPaths.invoices}>
            Invoices
          </Link>
        </article>
      </div>

      <section style={{ marginTop: 'var(--space-8)' }}>
        <h2 className="text-h3">Recent activity</h2>
        {activity.length === 0 ? (
          <EmptyState title="No audit events yet" description="Administrative actions will be logged here." />
        ) : (
          <ul className={ui.stack}>
            {activity.map((row) => (
              <li key={String(row.id)} className={`surface ${ui.dataCard}`}>
                <span className={ui.meta}>{new Date(String(row.createdAt)).toLocaleString()}</span>
                <strong>{String(row.action)}</strong>
                <span className={ui.meta}>
                  {String(row.entity)} {row.entityId ? `· ${String(row.entityId)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className={ui.meta} style={{ marginTop: 'var(--space-3)' }}>
          <Link className="link-underline" to={adminPortalPaths.auditLogs}>
            Full audit log
          </Link>
        </p>
      </section>
    </>
  )
}
