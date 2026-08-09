import { Link } from 'react-router-dom'
import { EmptyState, ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import { ProjectRequestListItem } from '@/components/portal/ProjectRequestListItem'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { customerPortalPaths } from '@/config/customer-portal'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { customerApi, type CustomerDashboard } from '@/services/customer-portal'
import { StatusPill } from '@/components/portal/CustomerPortalUi'
import styles from './CustomerDashboardPage.module.css'

function friendlyPortalError(message: string): string {
  if (/unauthorized|401/i.test(message)) return 'Please sign in again to continue.'
  return 'We could not load your dashboard. Please try again.'
}

export function CustomerDashboardPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.dashboard(), [])
  const requests = useFetch(() => customerApi.projectRequests.list(), [])

  if (loading) return <ListSkeleton rows={6} />
  if (error) return <PortalError message={friendlyPortalError(error)} onRetry={reload} />
  if (!data) return null

  const pendingCount =
    data.pendingApprovals.length + data.outstandingInvoices.length + data.openSupportTickets.length
  const planningProjects = data.planningProjects ?? []
  const recentRequests = (requests.data?.items ?? []).slice(0, 3)
  const hasActivity =
    data.recentNotifications.length > 0 ||
    data.recentMessages.length > 0 ||
    data.recentPayments.length > 0 ||
    recentRequests.length > 0

  return (
    <>
      <header className={styles.hero}>
        <div>
          <p className="text-label">Dashboard</p>
          <h1 className="text-h1">Welcome back, {data.welcomeName}</h1>
          <p className={styles.heroDesc}>
            {data.companyName
              ? `${data.companyName} — track requests, projects, and next steps.`
              : 'Track your project requests, active work, and next steps.'}
          </p>
        </div>
        <Button to={customerPortalPaths.startProject} size="lg">
          Start Your Project
        </Button>
      </header>

      <section className={ui.cardGrid} aria-labelledby="dash-requests">
        <article className={`surface ${ui.dataCard}`}>
          <div className={styles.sectionHead}>
            <h2 id="dash-requests" className="text-h3">
              Project requests
            </h2>
            <Link className="link-underline" to={customerPortalPaths.requests}>
              View all
            </Link>
          </div>
          {requests.loading ? (
            <ListSkeleton rows={2} />
          ) : requests.error ? (
            <p className={ui.meta}>Project requests are temporarily unavailable.</p>
          ) : recentRequests.length === 0 ? (
            <EmptyState
              title="You haven't submitted a project request yet"
              description="Tell us what you are building—we will review and follow up."
              action={
                <Button to={customerPortalPaths.startProject}>Start Your Project</Button>
              }
            />
          ) : (
            <ul className={ui.stack}>
              {recentRequests.map((row) => (
                <li key={row.id}>
                  <ProjectRequestListItem row={row} />
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={`surface ${ui.dataCard}`}>
          <div className={styles.sectionHead}>
            <h2 className="text-h3">Active projects</h2>
            <Link className="link-underline" to={customerPortalPaths.projects}>
              View all
            </Link>
          </div>
          {data.activeProjects.length === 0 && planningProjects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Your projects will appear here once a project has been created."
              action={
                <Button to={customerPortalPaths.startProject} variant="secondary">
                  Start Your Project
                </Button>
              }
            />
          ) : (
            <ul className={ui.stack}>
              {planningProjects.map((p) => (
                <li key={`plan-${p.id}`}>
                  <Link className="link-underline" to={customerPortalPaths.projectDetail(p.id)}>
                    {p.reference ? `${p.reference} · ` : ''}
                    {p.name}
                  </Link>
                  <StatusPill status={p.statusLabel ?? p.status} />
                  <span className={ui.meta}>Planning</span>
                  {p.currentMilestone ? (
                    <span className={ui.meta}>
                      Current: {p.currentMilestone.name} ({p.currentMilestone.statusLabel})
                    </span>
                  ) : (
                    <span className={ui.meta}>Milestones will appear as your project progresses.</span>
                  )}
                </li>
              ))}
              {data.activeProjects.map((p) => (
                <li key={p.id}>
                  <Link className="link-underline" to={customerPortalPaths.projectDetail(p.id)}>
                    {p.reference ? `${p.reference} · ` : ''}
                    {p.name}
                  </Link>
                  <StatusPill status={p.statusLabel ?? p.status} />
                  {p.progressPercent != null ? (
                    <span className={ui.meta} aria-label={`Progress ${p.progressPercent} percent`}>
                      Progress {p.progressPercent}%
                    </span>
                  ) : null}
                  {p.currentMilestone ? (
                    <span className={ui.meta}>
                      Current: {p.currentMilestone.name} ({p.currentMilestone.statusLabel})
                      {p.currentMilestone.overdueNote ? ` · ${p.currentMilestone.overdueNote}` : ''}
                    </span>
                  ) : p.milestonesSummary === 'none' ? (
                    <span className={ui.meta}>Milestones will appear as your project progresses.</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Pending actions</h2>
          {pendingCount === 0 ? (
            <EmptyState title="You're all caught up" description="No approvals, invoices, or support items need your attention right now." />
          ) : (
            <ul className={ui.stack}>
              {data.pendingApprovals.map((p) => (
                <li key={p.id}>
                  <Link className="link-underline" to={customerPortalPaths.proposalDetail(p.id)}>
                    Review proposal: {p.title ?? 'Proposal'}
                  </Link>
                </li>
              ))}
              {data.outstandingInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link className="link-underline" to={customerPortalPaths.invoiceDetail(inv.id)}>
                    Invoice {inv.invoiceNumber}
                  </Link>
                </li>
              ))}
              {data.openSupportTickets.map((t) => (
                <li key={t.id}>
                  <Link className="link-underline" to={customerPortalPaths.supportDetail(t.id)}>
                    Support: {t.subject}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className={ui.stack} style={{ marginTop: 'var(--space-8)' }} aria-labelledby="dash-activity">
        <h2 id="dash-activity" className="text-h3">
          Recent activity
        </h2>
        {!hasActivity ? (
          <EmptyState
            title="No recent activity"
            description="Submissions, messages, and payments will show here when available."
          />
        ) : (
          <ul className={ui.timeline}>
            {recentRequests.map((row) => (
              <li key={`req-${row.id}`}>
                <strong>Project request submitted</strong>
                <br />
                <span className={ui.meta}>
                  {row.serviceInterest ?? 'Request'} ·{' '}
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
            {data.recentPayments.map((pay) => (
              <li key={pay.id}>
                <strong>Payment recorded</strong>
                <br />
                <span className={ui.meta}>
                  ₹{pay.amount} · {new Date(pay.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
            {data.recentMessages.map((m) => (
              <li key={m.id}>
                <strong>Message</strong>
                <br />
                <span className={ui.meta}>{m.body.slice(0, 100)}{m.body.length > 100 ? '…' : ''}</span>
              </li>
            ))}
          </ul>
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

export type { CustomerDashboard }
