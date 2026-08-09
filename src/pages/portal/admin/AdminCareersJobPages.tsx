import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ListSkeleton,
  PageIntro,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import {
  adminPortalPaths,
  careerEmploymentTypeOptions,
  careerJobStatusOptions,
} from '@/config/admin-portal'
import { useAuth } from '@/contexts/AuthProvider'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { normalizeCareerJobSlug } from '@/lib/careers/slug'
import styles from './AdminCareers.module.css'
import { CareersSubNav } from './AdminCareersSubNav'

type JobRow = {
  id: string
  slug: string
  title: string
  department: string
  status: string
  employmentType: string
  applicationCount: number
  applicationStatusCounts: Record<string, number>
  updatedAt: string
}

export function AdminCareersJobsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const { profile } = useAuth()
  const canManage = Boolean(profile?.permissions.includes('careers.manage'))
  const { data, error, loading, reload } = useFetch(
    () => adminApi.careers.listJobs({ status: statusFilter || undefined, q: q || undefined }),
    [statusFilter, q],
  )

  if (loading) return <ListSkeleton rows={8} />
  if (error) return <PortalError message={error} onRetry={reload} />

  const items = (data?.items as JobRow[]) ?? []

  return (
    <>
      <PageIntro
        label="Talent"
        title="Job openings"
        description="Create and publish real openings. Draft jobs are never shown on the public Careers page."
      />
      <CareersSubNav active="jobs" />
      <div className={styles.toolbar}>
        {canManage ? (
          <Link className={`button ${styles.createLink}`} to={adminPortalPaths.careersJobNew}>
            Create job
          </Link>
        ) : null}
        <label className={styles.filter}>
          <span className={ui.meta}>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.select}
          >
            <option value="">All</option>
            {careerJobStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
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
            onChange={(event) => setQ(event.target.value)}
            placeholder="Title, slug, department"
          />
        </label>
      </div>
      <p className={ui.meta}>{items.length} jobs</p>
      {items.length === 0 ? (
        <p className={ui.meta}>No job openings yet. Create a draft when you are ready.</p>
      ) : (
        <ul className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          {items.map((row) => (
            <li key={row.id}>
              <Link className={`surface ${ui.dataCard} ${styles.rowLink}`} to={adminPortalPaths.careersJobDetail(row.id)}>
                <div className={styles.rowHead}>
                  <strong>{row.title}</strong>
                  <StatusPill status={row.status} />
                </div>
                <span className={ui.meta}>
                  {row.slug} · {row.department} · {row.employmentType}
                </span>
                <span className={ui.meta}>
                  {row.applicationCount} applications
                  {row.applicationStatusCounts.new
                    ? ` · ${row.applicationStatusCounts.new} new`
                    : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

type JobFormState = {
  slug: string
  title: string
  department: string
  employmentType: string
  experienceLevel: string
  locationLabel: string
  remoteStatus: string
  shortDescription: string
  responsibilities: string
  requiredSkills: string
  preferredSkills: string
  closesAt: string
}

const emptyJobForm: JobFormState = {
  slug: '',
  title: '',
  department: '',
  employmentType: 'full_time',
  experienceLevel: '',
  locationLabel: '',
  remoteStatus: '',
  shortDescription: '',
  responsibilities: '',
  requiredSkills: '',
  preferredSkills: '',
  closesAt: '',
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function AdminCareersJobEditPage() {
  const { id } = useParams()
  const isNew = id === 'new' || !id
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const duplicateFrom = searchParams.get('from')
  const { profile } = useAuth()
  const canManage = Boolean(profile?.permissions.includes('careers.manage'))

  const { data, error, loading, reload } = useFetch(
    () => (isNew ? Promise.resolve(null) : adminApi.careers.getJob(id!)),
    [id, isNew],
  )

  const { data: duplicateData } = useFetch(
    () => (isNew && duplicateFrom ? adminApi.careers.getJob(duplicateFrom) : Promise.resolve(null)),
    [isNew, duplicateFrom],
  )

  const initial = useMemo(() => {
    if (!isNew && data?.job) {
      const job = data.job as Record<string, unknown>
      return {
        slug: String(job.slug ?? ''),
        title: String(job.title ?? ''),
        department: String(job.department ?? ''),
        employmentType: String(job.employmentType ?? 'full_time'),
        experienceLevel: String(job.experienceLevel ?? ''),
        locationLabel: String(job.locationLabel ?? ''),
        remoteStatus: String(job.remoteStatus ?? ''),
        shortDescription: String(job.shortDescription ?? ''),
        responsibilities: String(job.responsibilities ?? ''),
        requiredSkills: String(job.requiredSkills ?? ''),
        preferredSkills: String(job.preferredSkills ?? ''),
        closesAt: toDatetimeLocalValue(job.closesAt as string | null),
      }
    }
    if (isNew && duplicateData?.job) {
      const job = duplicateData.job as Record<string, unknown>
      return {
        ...emptyJobForm,
        title: `${String(job.title ?? '')} (copy)`,
        slug: '',
        department: String(job.department ?? ''),
        employmentType: String(job.employmentType ?? 'full_time'),
        experienceLevel: String(job.experienceLevel ?? ''),
        locationLabel: String(job.locationLabel ?? ''),
        remoteStatus: String(job.remoteStatus ?? ''),
        shortDescription: String(job.shortDescription ?? ''),
        responsibilities: String(job.responsibilities ?? ''),
        requiredSkills: String(job.requiredSkills ?? ''),
        preferredSkills: String(job.preferredSkills ?? ''),
      }
    }
    return emptyJobForm
  }, [isNew, data, duplicateData])

  const [form, setForm] = useState<JobFormState>(initial)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    setForm(initial)
  }, [initial])

  if (!canManage) {
    return <PortalError message="You do not have permission to manage job openings." />
  }

  if (!isNew && loading) return <ListSkeleton />
  if (!isNew && error) return <PortalError message={error} onRetry={reload} />

  const job = !isNew ? (data?.job as Record<string, unknown> | undefined) : undefined
  const status = job ? String(job.status) : 'draft'
  const stats = (data?.applicationStatusCounts as Record<string, number> | undefined) ?? {}

  const setField = (name: keyof JobFormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'title' && !slugTouched && isNew) {
        next.slug = normalizeCareerJobSlug(value)
      }
      return next
    })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = {
      ...form,
      closesAt: fromDatetimeLocalValue(form.closesAt),
      preferredSkills: form.preferredSkills || null,
      experienceLevel: form.experienceLevel || null,
      locationLabel: form.locationLabel || null,
      remoteStatus: form.remoteStatus || null,
    }
    try {
      if (isNew) {
        const res = (await adminApi.careers.createJob(payload)) as { job?: { id: string } }
        const createdId = res.job?.id
        if (!createdId) throw new Error('Job was created but no id was returned.')
        navigate(adminPortalPaths.careersJobDetail(createdId))
      } else {
        await adminApi.careers.updateJob(id!, payload)
        await reload()
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save job.')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (next: 'published' | 'closed' | 'draft') => {
    const labels: Record<string, string> = {
      published: 'Publish this job? It will appear on the public Careers page.',
      closed: 'Close this job? New applications will no longer be accepted.',
      draft: 'Move this job back to draft? It will be hidden from the public site.',
    }
    if (!window.confirm(labels[next])) return
    setSaving(true)
    setFormError(null)
    try {
      await adminApi.careers.updateJobStatus(id!, next)
      await reload()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not update status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageIntro
        title={isNew ? 'Create job opening' : String(job?.title ?? 'Edit job')}
        description={isNew ? 'Saved as draft until you publish.' : `Status: ${status}`}
      />
      <CareersSubNav active="jobs" />
      {!isNew ? (
        <div className={styles.statusRow}>
          <StatusPill status={status} />
          <span className={ui.meta}>
            {Number(data?.applicationCount ?? 0)} applications
            {stats.new ? ` · ${stats.new} new` : ''}
          </span>
          <Link
            className="link-underline"
            to={`${adminPortalPaths.careers}?jobOpeningId=${encodeURIComponent(id!)}`}
          >
            View applications
          </Link>
        </div>
      ) : null}

      <form className={styles.jobForm} onSubmit={(event) => void save(event)}>
        <Input
          id="job-title"
          label="Title"
          required
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />
        <Input
          id="job-slug"
          label="URL slug"
          required
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true)
            setField('slug', normalizeCareerJobSlug(e.target.value))
          }}
          hint="Used in /careers/openings/your-slug — change only with care for published jobs."
        />
        <div className={styles.formGrid}>
          <Input
            id="job-department"
            label="Department"
            required
            value={form.department}
            onChange={(e) => setField('department', e.target.value)}
          />
          <Select
            id="job-employment"
            label="Employment type"
            required
            options={careerEmploymentTypeOptions.map((o) => ({ value: o.value, label: o.label }))}
            value={form.employmentType}
            onChange={(e) => setField('employmentType', e.target.value)}
          />
        </div>
        <div className={styles.formGrid}>
          <Input
            id="job-experience"
            label="Experience level"
            value={form.experienceLevel}
            onChange={(e) => setField('experienceLevel', e.target.value)}
          />
          <Input
            id="job-location"
            label="Location"
            value={form.locationLabel}
            onChange={(e) => setField('locationLabel', e.target.value)}
          />
          <Input
            id="job-remote"
            label="Remote status"
            value={form.remoteStatus}
            onChange={(e) => setField('remoteStatus', e.target.value)}
          />
        </div>
        <Textarea
          id="job-short"
          label="Short description"
          required
          rows={3}
          value={form.shortDescription}
          onChange={(e) => setField('shortDescription', e.target.value)}
        />
        <Textarea
          id="job-responsibilities"
          label="Responsibilities & role detail"
          required
          rows={6}
          value={form.responsibilities}
          onChange={(e) => setField('responsibilities', e.target.value)}
        />
        <Textarea
          id="job-required"
          label="Required skills"
          required
          rows={4}
          value={form.requiredSkills}
          onChange={(e) => setField('requiredSkills', e.target.value)}
        />
        <Textarea
          id="job-preferred"
          label="Preferred skills"
          rows={3}
          value={form.preferredSkills}
          onChange={(e) => setField('preferredSkills', e.target.value)}
        />
        <Input
          id="job-closes"
          label="Closing date (optional)"
          type="datetime-local"
          value={form.closesAt}
          onChange={(e) => setField('closesAt', e.target.value)}
        />

        {formError ? (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        ) : null}

        <div className={styles.formActions}>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Save draft' : 'Save changes'}
          </button>
          <Link className="link-underline" to={adminPortalPaths.careersJobs}>
            Back to jobs
          </Link>
        </div>
      </form>

      {!isNew && job ? (
        <section className={`surface ${styles.panel}`}>
          <h2 className="text-h3">Publishing</h2>
          <p className={ui.meta}>Publishing is explicit — drafts are never shown publicly.</p>
          <div className={styles.statusForm}>
            {status !== 'published' ? (
              <button type="button" disabled={saving} onClick={() => void changeStatus('published')}>
                Publish
              </button>
            ) : null}
            {status === 'published' ? (
              <button type="button" disabled={saving} onClick={() => void changeStatus('closed')}>
                Close job
              </button>
            ) : null}
            {status === 'closed' ? (
              <button type="button" disabled={saving} onClick={() => void changeStatus('published')}>
                Reopen (publish)
              </button>
            ) : null}
            {status !== 'draft' ? (
              <button type="button" disabled={saving} onClick={() => void changeStatus('draft')}>
                Move to draft
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  )
}
