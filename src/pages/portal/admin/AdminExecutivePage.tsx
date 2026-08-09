import { Link } from 'react-router-dom'
import { ListSkeleton, PageIntro, PortalError } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { adminPortalPaths } from '@/config/admin-portal'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { friendlyAdminPortalError } from '@/lib/admin/portal-errors'

function formatInr(amount: string | null | undefined) {
  if (!amount) return '₹0'
  const n = Number.parseFloat(amount)
  if (Number.isNaN(n)) return `₹${amount}`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
}

export function AdminExecutivePage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.executive.overview(), [])

  if (loading) return <ListSkeleton rows={10} />
  if (error) return <PortalError message={friendlyAdminPortalError(error)} onRetry={reload} />
  if (!data) return null

  const actual = (data.actual as Record<string, unknown>) ?? {}
  const pipeline = (data.pipeline as Record<string, unknown>) ?? {}
  const delivery = (data.delivery as Record<string, unknown>) ?? {}
  const product = (data.product as Record<string, unknown>) ?? {}
  const reporting = (data.reporting as Record<string, string>) ?? {}

  return (
    <>
      <PageIntro
        label="Executive"
        title="Founder & leadership overview"
        description="Live database metrics only. Pipeline figures are not recognized revenue."
      />
      <p className={ui.meta}>
        Growth stage: <strong>{String(data.growthStage ?? '')}</strong> · Generated{' '}
        {data.generatedAt ? new Date(String(data.generatedAt)).toLocaleString() : '—'}
      </p>
      <p className={ui.meta}>{reporting.actual}</p>
      <p className={ui.meta}>{reporting.pipeline}</p>

      <div className={ui.cardGrid} style={{ marginTop: 'var(--space-4)' }}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Revenue (paid)</h2>
          <p className="text-h2">{formatInr(String(actual.revenueSucceeded ?? '0'))}</p>
          <span className={ui.meta}>Actual · payments succeeded</span>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Outstanding invoices</h2>
          <p className="text-h2">{formatInr(String(actual.outstandingInvoicesTotal ?? '0'))}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Open opportunities</h2>
          <p className="text-h2">{String(pipeline.openOpportunities ?? 0)}</p>
          <span className={ui.meta}>Pipeline</span>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Active projects</h2>
          <p className="text-h2">{String(delivery.activeProjects ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Open tasks</h2>
          <p className="text-h2">{String(delivery.openTasks ?? 0)}</p>
          <span className={ui.meta}>Overdue: {String(delivery.overdueTasks ?? 0)}</span>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Client Hub waitlist</h2>
          <p className="text-h2">{String(product.clientHubWaitlist ?? 0)}</p>
          <Link className="link-underline" to={adminPortalPaths.productWaitlist}>
            Review sign-ups
          </Link>
        </article>
      </div>

      <p className={ui.meta} style={{ marginTop: 'var(--space-6)' }}>
        <Link className="link-underline" to={adminPortalPaths.teamAccess}>
          Team access review
        </Link>
        {' · '}
        <Link className="link-underline" to={adminPortalPaths.revenue}>
          Revenue detail
        </Link>
      </p>
    </>
  )
}
