import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { Button } from '@/components/ui/Button'

export function AdminFreelancersPage() {
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(
    () => adminApi.freelancers.list({ q: q || undefined }),
    [q],
  )
  const items = (data?.items as Array<Record<string, unknown>>) ?? []

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <>
      <PageIntro title="Freelancers" description="Approved network onboarding and verification." />
      <label className={ui.field}>
        Search
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search freelancers" />
      </label>
      {items.length === 0 ? (
        <EmptyState title="No freelancers" description="Applications will appear here after submission." />
      ) : (
        <ul className={ui.stack}>
          {items.map((row) => (
            <li key={String(row.id)} className={`surface ${ui.dataCard}`}>
              <Link className="link-underline" to={adminPortalPaths.freelancerDetail(String(row.id))}>
                <strong>{String(row.fullName)}</strong>
              </Link>
              <p className={ui.meta}>
                {String(row.reference)} · {String(row.email)} · {String(row.professionalRole)}
              </p>
              <p className={ui.meta}>
                Verification {String(row.verificationStatus)} · Approval {String(row.approvalStatus)} ·{' '}
                {String(row.availabilityStatus)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminFreelancerDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => adminApi.freelancers.get(id), [id])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const notes = (data.internalNotes as Array<Record<string, unknown>>) ?? []

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    try {
      await adminApi.freelancers.patch(id, body)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setBusy(true)
    try {
      await adminApi.freelancers.addNote(id, note.trim())
      setNote('')
      await reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageIntro title={String(data.fullName)} description={String(data.reference)} />
      <p className={ui.meta}>{String(data.email)}</p>
      <p>{String(data.bio)}</p>
      <div className={ui.actionsRow} style={{ flexWrap: 'wrap' }}>
        <Button type="button" disabled={busy} onClick={() => void patch({ verificationStatus: 'verified' })}>
          Mark verified
        </Button>
        <Button type="button" disabled={busy} onClick={() => void patch({ approvalStatus: 'approved' })}>
          Approve
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void patch({ approvalStatus: 'rejected' })}>
          Reject
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void patch({ approvalStatus: 'suspended' })}>
          Suspend
        </Button>
      </div>
      <section className={ui.stack}>
        <h2 className="text-h3">Internal notes</h2>
        <ul className={ui.stack}>
          {notes.map((n) => (
            <li key={String(n.id)} className={ui.meta}>
              {String(n.content)}
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => void addNote(e)}>
          <label>
            Add note
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </label>
          <Button type="submit" disabled={busy}>
            Save note
          </Button>
        </form>
      </section>
      <Link to={adminPortalPaths.freelancers}>Back to freelancers</Link>
    </>
  )
}
