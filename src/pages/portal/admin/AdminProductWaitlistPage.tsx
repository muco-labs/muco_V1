import { PageIntro, ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { friendlyAdminPortalError } from '@/lib/admin/portal-errors'

type WaitlistRow = {
  id: string
  productSlug: string
  email: string
  fullName: string | null
  company: string | null
  useCase: string | null
  marketingConsent: boolean
  sourcePath: string | null
  createdAt: string
}

export function AdminProductWaitlistPage() {
  const { data, error, loading, reload } = useFetch(
    () => adminApi.product.waitlist('client-hub'),
    [],
  )

  if (loading) return <ListSkeleton rows={10} />
  if (error) return <PortalError message={friendlyAdminPortalError(error)} onRetry={reload} />

  const items = (data?.items as WaitlistRow[]) ?? []
  const count = Number(data?.count ?? items.length)

  return (
    <>
      <PageIntro
        label="Product validation"
        title="Client Hub waitlist"
        description="Real sign-ups only—no seeded demo users. Use for founder outreach and validation interviews."
      />
      <p className={ui.meta}>{count} entries (client-hub)</p>
      {items.length === 0 ? (
        <p className={ui.meta}>No waitlist entries yet.</p>
      ) : (
        <ul className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          {items.map((row) => (
            <li key={row.id} className={`surface ${ui.dataCard}`}>
              <strong>{row.email}</strong>
              {row.fullName ? ` · ${row.fullName}` : ''}
              {row.company ? ` · ${row.company}` : ''}
              <br />
              <span className={ui.meta}>
                {new Date(row.createdAt).toLocaleString()} · consent:{' '}
                {row.marketingConsent ? 'yes' : 'no'}
                {row.sourcePath ? ` · ${row.sourcePath}` : ''}
              </span>
              {row.useCase ? <p className={ui.meta}>{row.useCase}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
