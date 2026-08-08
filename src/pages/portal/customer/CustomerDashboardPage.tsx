import { Link } from 'react-router-dom'
import { EmptyState, ListSkeleton, PageIntro, PortalError, StatusPill } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { customerPortalPaths } from '@/config/customer-portal'
import { useFetch } from '@/hooks/useFetch'
import { customerApi, type CustomerDashboard } from '@/services/customer-portal'

export function CustomerDashboardPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.dashboard(), [])

  if (loading) return <ListSkeleton rows={6} />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  return (
    <>
      <PageIntro
        label="Dashboard"
        title={`Welcome, ${data.welcomeName}`}
        description={
          data.companyName
            ? `${data.companyName} — your projects, billing, and messages in one place.`
            : 'Your projects, billing, and messages in one place.'
        }
      />

      <section className={ui.cardGrid} aria-labelledby="dash-projects">
        <article className={`surface ${ui.dataCard}`}>
          <h2 id="dash-projects" className="text-h3">
            Active projects
          </h2>
          {data.activeProjects.length === 0 ? (
            <EmptyState
              title="No active projects yet"
              description="No projects have been assigned to your account yet."
              action={
                <Link className="link-underline" to={customerPortalPaths.projects}>
                  View projects
                </Link>
              }
            />
          ) : (
            <ul className={ui.stack}>
              {data.activeProjects.map((p) => (
                <li key={p.id}>
                  <Link className="link-underline" to={customerPortalPaths.projectDetail(p.id)}>
                    {p.name}
                  </Link>
                  <StatusPill status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Pending approvals</h2>
          {data.pendingApprovals.length === 0 ? (
            <EmptyState
              title="You have no pending approvals"
              description="Proposals awaiting your review will appear here."
            />
          ) : (
            <ul className={ui.stack}>
              {data.pendingApprovals.map((p) => (
                <li key={p.id}>
                  <Link className="link-underline" to={customerPortalPaths.proposalDetail(p.id)}>
                    {p.title ?? 'Proposal'}
                  </Link>
                  <StatusPill status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Outstanding invoices</h2>
          {data.outstandingInvoices.length === 0 ? (
            <EmptyState title="No outstanding invoices" description="Your invoices will appear here." />
          ) : (
            <ul className={ui.stack}>
              {data.outstandingInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link className="link-underline" to={customerPortalPaths.invoiceDetail(inv.id)}>
                    {inv.invoiceNumber}
                  </Link>
                  <span className={ui.meta}>
                    ₹{inv.amount} · <StatusPill status={inv.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Open support</h2>
          {data.openSupportTickets.length === 0 ? (
            <EmptyState
              title="No open tickets"
              description="You don't have any open support requests."
              action={
                <Link className="link-underline" to={customerPortalPaths.support}>
                  Contact support
                </Link>
              }
            />
          ) : (
            <ul className={ui.stack}>
              {data.openSupportTickets.map((t) => (
                <li key={t.id}>
                  <Link className="link-underline" to={customerPortalPaths.supportDetail(t.id)}>
                    {t.subject}
                  </Link>
                  <StatusPill status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className={ui.stack} style={{ marginTop: 'var(--space-8)' }}>
        <h2 className="text-h3">Recent activity</h2>
        {data.recentNotifications.length === 0 &&
        data.recentMessages.length === 0 &&
        data.recentPayments.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Updates about projects, payments, and messages will show here."
          />
        ) : (
          <div className={ui.cardGrid}>
            {data.recentPayments.length > 0 ? (
              <article className={`surface ${ui.dataCard}`}>
                <h3>Payments</h3>
                <ul className={ui.stack}>
                  {data.recentPayments.map((pay) => (
                    <li key={pay.id} className={ui.meta}>
                      ₹{pay.amount} · <StatusPill status={pay.status} />
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
            {data.recentMessages.length > 0 ? (
              <article className={`surface ${ui.dataCard}`}>
                <h3>Messages</h3>
                <ul className={ui.stack}>
                  {data.recentMessages.map((m) => (
                    <li key={m.id} className={ui.meta}>
                      {m.body.slice(0, 120)}
                      {m.body.length > 120 ? '…' : ''}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>
        )}
        {data.unreadNotificationCount > 0 ? (
          <p className={ui.meta}>
            <Link className="link-underline" to={customerPortalPaths.notifications}>
              {data.unreadNotificationCount} unread notification
              {data.unreadNotificationCount === 1 ? '' : 's'}
            </Link>
          </p>
        ) : null}
      </section>
    </>
  )
}

// silence unused type export for future strict typing
export type { CustomerDashboard }
