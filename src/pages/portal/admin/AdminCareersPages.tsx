import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ListSkeleton,
  PageIntro,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { adminPortalPaths, careerApplicationStatusOptions, careerApplicationTypeFilterOptions } from '@/config/admin-portal'
import { CareersSubNav } from '@/pages/portal/admin/AdminCareersSubNav'
import { useAuth } from '@/contexts/auth-context'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import styles from './AdminCareers.module.css'

type ApplicationRow = {
  id: string
  reference: string
  fullName: string
  email: string
  roleInterest: string
  applicationType: string
  experienceLevel: string | null
  city: string | null
  country: string | null
  status: string
  createdAt: string
  jobTitle: string | null
}

export function AdminCareersApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') ?? ''
  const jobFilter = searchParams.get('jobOpeningId') ?? ''
  const typeFilter = searchParams.get('applicationType') ?? ''
  const q = searchParams.get('q') ?? ''

  const { data: jobsData } = useFetch(() => adminApi.careers.listJobs(), [])
  const jobOptions = (jobsData?.items as Array<{ id: string; title: string }>) ?? []

  const { data, error, loading, reload } = useFetch(
    () =>
      adminApi.careers.listApplications({
        status: statusFilter || undefined,
        jobOpeningId: jobFilter || undefined,
        applicationType: typeFilter || undefined,
        q: q || undefined,
      }),
    [statusFilter, jobFilter, typeFilter, q],
  )

  if (loading) return <ListSkeleton rows={10} />
  if (error) return <PortalError message={error} onRetry={reload} />

  const items = (data?.items as ApplicationRow[]) ?? []

  return (
    <>
      <PageIntro
        label="Talent"
        title="Career applications"
        description="Recruitment applications are separate from CRM sales leads."
      />
      <CareersSubNav active="applications" />
      <div className={styles.toolbar}>
        <label className={styles.filter}>
          <span className={ui.meta}>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams)
              if (event.target.value) next.set('status', event.target.value)
              else next.delete('status')
              setSearchParams(next)
            }}
            className={styles.select}
          >
            <option value="">All</option>
            {careerApplicationStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span className={ui.meta}>Job</span>
          <select
            value={jobFilter}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams)
              if (event.target.value) next.set('jobOpeningId', event.target.value)
              else next.delete('jobOpeningId')
              setSearchParams(next)
            }}
            className={styles.select}
          >
            <option value="">All</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span className={ui.meta}>Type</span>
          <select
            value={typeFilter}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams)
              if (event.target.value) next.set('applicationType', event.target.value)
              else next.delete('applicationType')
              setSearchParams(next)
            }}
            className={styles.select}
          >
            <option value="">All</option>
            {careerApplicationTypeFilterOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span className={ui.meta}>Search</span>
          <input
            type="search"
            className={styles.searchInput}
            value={q}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams)
              if (event.target.value) next.set('q', event.target.value)
              else next.delete('q')
              setSearchParams(next)
            }}
            placeholder="Name, email, role"
          />
        </label>
        <Link className="link-underline" to={adminPortalPaths.careersJobs}>
          Manage jobs
        </Link>
      </div>
      <p className={ui.meta}>{items.length} applications</p>
      {items.length === 0 ? (
        <p className={ui.meta}>No applications yet.</p>
      ) : (
        <ul className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          {items.map((row) => (
            <li key={row.id}>
              <Link className={`surface ${ui.dataCard} ${styles.rowLink}`} to={adminPortalPaths.careersApplicationDetail(row.id)}>
                <div className={styles.rowHead}>
                  <strong>{row.fullName}</strong>
                  <StatusPill status={row.status} />
                </div>
                <span className={ui.meta}>
                  {row.reference} · {row.roleInterest} · {row.applicationType}
                  {row.city || row.country
                    ? ` · ${[row.city, row.country].filter(Boolean).join(', ')}`
                    : ''}
                </span>
                <span className={ui.meta}>{new Date(row.createdAt).toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function AdminCareerApplicationDetailPage() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const canManage = Boolean(profile?.permissions.includes('careers.manage'))
  const canNotes = Boolean(profile?.permissions.includes('careers.notes'))
  const { data, error, loading, reload } = useFetch(() => adminApi.careers.getApplication(id), [id])
  const [statusValue, setStatusValue] = useState('')
  const [noteText, setNoteText] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data?.application) return null

  const app = data.application as Record<string, unknown>
  const notes = (data.notes as Array<Record<string, unknown>>) ?? []
  const currentStatus = String(app.status ?? 'new')
  const displayStatus = statusValue || currentStatus

  const saveStatus = async () => {
    if (!canManage || !statusValue || statusValue === currentStatus) return
    setSaving(true)
    setActionError(null)
    try {
      await adminApi.careers.updateApplicationStatus(id, statusValue)
      setStatusValue('')
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update status.')
    } finally {
      setSaving(false)
    }
  }

  const addNote = async () => {
    if (!canNotes || !noteText.trim()) return
    setSaving(true)
    setActionError(null)
    try {
      await adminApi.careers.addApplicationNote(id, noteText.trim())
      setNoteText('')
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not save note.')
    } finally {
      setSaving(false)
    }
  }

  const downloadResume = async () => {
    try {
      const res = await adminApi.careers.resumeDownloadUrl(id)
      if (res.url) window.open(String(res.url), '_blank', 'noopener,noreferrer')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Resume not available.')
    }
  }

  return (
    <>
      <PageIntro
        title={String(app.fullName)}
        description={`${String(app.reference)} · ${String(app.email)}`}
      />
      <div className={styles.statusRow}>
        <StatusPill status={currentStatus} />
      </div>

      <section className={ui.stack}>
        <h2 className="text-h3">Application</h2>
        <dl className={styles.dl}>
          <div>
            <dt>Role</dt>
            <dd>{String(app.roleInterest)}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{String(app.applicationType)}</dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>{String(app.experienceLevel ?? '—')}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>
              {[app.city, app.country].filter(Boolean).join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{new Date(String(app.createdAt)).toLocaleString()}</dd>
          </div>
          {app.jobTitle ? (
            <div>
              <dt>Opening</dt>
              <dd>{String(app.jobTitle)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className={ui.stack}>
        <h2 className="text-h3">Skills</h2>
        <p className={styles.pre}>{String(app.skills)}</p>
      </section>

      <section className={ui.stack}>
        <h2 className="text-h3">Introduction</h2>
        <p className={styles.pre}>{String(app.introduction)}</p>
      </section>

      <section className={ui.stack}>
        <h2 className="text-h3">Links & availability</h2>
        <ul className={styles.linkList}>
          {app.portfolioUrl ? (
            <li>
              Portfolio:{' '}
              <a href={String(app.portfolioUrl)} target="_blank" rel="noreferrer">
                {String(app.portfolioUrl)}
              </a>
            </li>
          ) : null}
          {app.linkedinUrl ? (
            <li>
              LinkedIn:{' '}
              <a href={String(app.linkedinUrl)} target="_blank" rel="noreferrer">
                {String(app.linkedinUrl)}
              </a>
            </li>
          ) : null}
          {app.githubUrl ? (
            <li>
              GitHub:{' '}
              <a href={String(app.githubUrl)} target="_blank" rel="noreferrer">
                {String(app.githubUrl)}
              </a>
            </li>
          ) : null}
          <li>Availability: {String(app.availability)}</li>
          {app.preferredEngagement ? (
            <li>Preferred engagement: {String(app.preferredEngagement)}</li>
          ) : null}
        </ul>
      </section>

      {app.additionalInfo ? (
        <section className={ui.stack}>
          <h2 className="text-h3">Additional information</h2>
          <p className={styles.pre}>{String(app.additionalInfo)}</p>
        </section>
      ) : null}

      {app.hasResume ? (
        <section className={ui.stack}>
          <h2 className="text-h3">Resume</h2>
          <button type="button" className="link-underline" onClick={() => void downloadResume()}>
            Download resume (signed link)
          </button>
        </section>
      ) : null}

      {canManage ? (
        <section className={`surface ${styles.panel}`}>
          <h2 className="text-h3">Update status</h2>
          <div className={styles.statusForm}>
            <select
              value={displayStatus}
              onChange={(event) => setStatusValue(event.target.value)}
              className={styles.select}
              aria-label="Application status"
            >
              {careerApplicationStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button type="button" disabled={saving} onClick={() => void saveStatus()}>
              Save status
            </button>
          </div>
        </section>
      ) : null}

      {canNotes ? (
        <section className={`surface ${styles.panel}`}>
          <h2 className="text-h3">Internal notes</h2>
          <p className={ui.meta}>Not visible to applicants.</p>
          <textarea
            className={styles.textarea}
            rows={3}
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            aria-label="Internal note"
          />
          <button type="button" disabled={saving} onClick={() => void addNote()}>
            Add note
          </button>
        </section>
      ) : null}

      {notes.length > 0 ? (
        <section className={ui.stack}>
          <h2 className="text-h3">Note history</h2>
          <ul className={ui.stack}>
            {notes.map((note) => (
              <li key={String(note.id)} className={`surface ${ui.dataCard}`}>
                <p className={styles.pre}>{String(note.content)}</p>
                <span className={ui.meta}>
                  {String(note.authorName)} · {new Date(String(note.createdAt)).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {actionError ? (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      ) : null}

      <p>
        <Link className="link-underline" to={adminPortalPaths.careers}>
          Back to applications
        </Link>
      </p>
    </>
  )
}
