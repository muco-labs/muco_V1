import { Link } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PortalAttention,
  PortalError,
} from '@/components/portal/CustomerPortalUi'
import { ProjectRequestListItem } from '@/components/portal/ProjectRequestListItem'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { customerPortalPaths } from '@/config/customer-portal'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { customerApi } from '@/services/customer-portal'
import { StatusPill } from '@/components/portal/CustomerPortalUi'
import { friendlyCustomerPortalError } from '@/lib/customer/portal-errors'
import styles from './CustomerDashboardPage.module.css'

export function CustomerDashboardPage() {
  const { data, error, loading, reload } = useFetch(() => customerApi.dashboard(), [])
  const requests = useFetch(() => customerApi.projectRequests.list(), [])

  if (loading) return <ListSkeleton rows={6} />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />
  if (!data) return null

  const pendingCount =
    data.pendingApprovals.length + data.outstandingInvoices.length + data.openSupportTickets.length
  const planningProjects = data.planningProjects ?? []
  const recentRequests = (requests.data?.items ?? []).slice(0, 3)
  const hasActivity =
    data.recentNotifications.length > 0 ||
    (data.messagesUnreadCount ?? 0) > 0 ||
    data.recentPayments.length > 0 ||
    recentRequests.length > 0

  const unreadMessages = data.messagesUnreadCount ?? 0
  const needsAttention = pendingCount > 0 || unreadMessages > 0
  const activeProjectCount = data.activeProjects.length + planningProjects.length

  return (
    <>
      {needsAttention ? (
        <PortalAttention
          title={
            pendingCount > 0 && unreadMessages > 0
              ? `${pendingCount} item${pendingCount === 1 ? '' : 's'} need your attention · ${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`
              : pendingCount > 0
                ? `${pendingCount} item${pendingCount === 1 ? '' : 's'} need your attention`
                : `${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`
          }
          description="Review proposals, invoices, or messages below."
        >
          {data.pendingApprovals[0] ? (
            <Link className="link-underline" to={customerPortalPaths.proposalDetail(data.pendingApprovals[0].id)}>
              Review proposal
            </Link>
          ) : null}
          {data.outstandingInvoices[0] ? (
            <Link className="link-underline" to={customerPortalPaths.invoiceDetail(data.outstandingInvoices[0].id)}>
              View invoice
            </Link>
          ) : null}
          {unreadMessages > 0 ? (
            <Link className="link-underline" to={customerPortalPaths.messages}>
              Open messages
            </Link>
          ) : null}
        </PortalAttention>
      ) : null}

      <header className={styles.hero}>
        <div className={styles.heroTop}>
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
        </div>
        <div className={styles.statRow} aria-label="Overview">
          <div className={styles.stat}>
            <span className={styles.statValue}>{pendingCount}</span>
            <span className={styles.statLabel}>Pending actions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{activeProjectCount}</span>
            <span className={styles.statLabel}>Active projects</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{unreadMessages}</span>
            <span className={styles.statLabel}>Unread messages</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.unreadNotificationCount}</span>
            <span className={styles.statLabel}>Notifications</span>
          </div>
        </div>
      </header>

      <div className={styles.bento}>
        <article className={styles.panel} aria-labelledby="dash-requests">
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

        <article className={styles.panel} aria-labelledby="dash-projects">
          <div className={styles.sectionHead}>
            <h2 id="dash-projects" className="text-h3">
              Active projects
            </h2>
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

        <article className={`${styles.panel} ${styles.bentoWide}`} aria-labelledby="dash-pending">
          <div className={styles.sectionHead}>
            <h2 id="dash-pending" className="text-h3">
              Pending actions
            </h2>
          </div>
          {pendingCount === 0 ? (
            <EmptyState
              title="You're all caught up"
              description="No approvals, invoices, or support items need your attention right now."
            />
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
      </div>

      <section className={styles.stackSection} aria-labelledby="dash-messages">
        <h2 id="dash-messages" className="text-h3">
          Messages
        </h2>
        {(data.messagesUnreadCount ?? 0) === 0 && !data.latestConversation ? (
          <EmptyState
            title="No messages yet"
            description="When your team replies, conversations will appear here."
          />
        ) : (
          <article className={styles.panel}>
            {(data.messagesUnreadCount ?? 0) > 0 ? (
              <p className={ui.meta}>
                <strong>{data.messagesUnreadCount}</strong> unread message
                {data.messagesUnreadCount === 1 ? '' : 's'}
              </p>
            ) : null}
            {data.latestConversation ? (
              <>
                <Link
                  className="link-underline"
                  to={customerPortalPaths.conversationDetail(data.latestConversation.id)}
                >
                  {data.latestConversation.subject}
                </Link>
                <p className={ui.meta}>{data.latestConversation.contextLabel}</p>
                {data.latestConversation.latestMessage ? (
                  <p className={ui.meta}>
                    {data.latestConversation.latestMessage.body.slice(0, 100)}
                    {data.latestConversation.latestMessage.body.length > 100 ? '…' : ''}
                  </p>
                ) : null}
                <time className={ui.meta} dateTime={data.latestConversation.updatedAt}>
                  {new Date(data.latestConversation.updatedAt).toLocaleString()}
                </time>
              </>
            ) : null}
            <p style={{ marginTop: 'var(--space-3)' }}>
              <Link className="link-underline" to={customerPortalPaths.messages}>
                View all messages
              </Link>
            </p>
          </article>
        )}
      </section>

      <section className={styles.stackSection} aria-labelledby="dash-activity">
        <h2 id="dash-activity" className="text-h3">
          Recent activity
        </h2>
        {!hasActivity ? (
          <EmptyState
            title="No recent activity"
            description="Submissions, messages, and payments will show here when available."
          />
        ) : (
          <article className={styles.panel}>
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
            </ul>
          </article>
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

export type { CustomerDashboard } from '@/services/customer-portal'
