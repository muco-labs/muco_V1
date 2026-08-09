import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { Button } from '@/components/ui/Button'
import { JobPostingSchema } from '@/components/seo/StructuredData'
import { env } from '@/config/env'
import { routePaths, careersOpeningPath } from '@/config/routes'
import { fetchCareerOpening, type CareerJobOpeningDetail } from '@/services/careers'
import styles from './CareersOpeningPage.module.css'

export function CareersOpeningPage() {
  const { slug = '' } = useParams()
  const [job, setJob] = useState<CareerJobOpeningDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchCareerOpening(slug)
      .then((data) => {
        if (!cancelled) setJob(data)
      })
      .catch(() => {
        if (!cancelled) setError('This opening is not available.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <PageShell title="Role" path={`/careers/openings/${slug}`} description="Loading…">
        <p className={styles.muted} role="status">
          Loading…
        </p>
      </PageShell>
    )
  }

  if (error || !job) {
    return (
      <PageShell
        title="Role not found"
        path={`/careers/openings/${slug}`}
        description="This role is not available."
        noIndex
      >
        <p>{error ?? 'This opening is not available.'}</p>
        <Button to={routePaths.careers} variant="secondary">
          Back to Careers
        </Button>
      </PageShell>
    )
  }

  const path = careersOpeningPath(job.slug)
  const applyHref = `${routePaths.careersApply}?job=${encodeURIComponent(job.slug)}`

  return (
    <>
      <JobPostingSchema
        title={job.title}
        description={job.shortDescription}
        url={`${env.siteUrl}${path}`}
        employmentType={job.employmentType}
        datePosted={job.publishedAt ?? undefined}
        validThrough={job.closesAt ?? undefined}
        hiringOrganization={{ name: 'MUCO LABS', sameAs: env.siteUrl }}
      />
      <PageShell title={job.title} path={path} description={job.shortDescription}>
        <p className={styles.meta}>
          {[job.department, job.employmentType, job.locationLabel, job.remoteStatus]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p>{job.shortDescription}</p>

        {job.responsibilities ? (
          <section className={styles.section}>
            <h2 className="text-h3">Responsibilities</h2>
            <p className={styles.body}>{job.responsibilities}</p>
          </section>
        ) : null}

        {job.requiredSkills ? (
          <section className={styles.section}>
            <h2 className="text-h3">Required skills</h2>
            <p className={styles.body}>{job.requiredSkills}</p>
          </section>
        ) : null}

        {job.preferredSkills ? (
          <section className={styles.section}>
            <h2 className="text-h3">Preferred skills</h2>
            <p className={styles.body}>{job.preferredSkills}</p>
          </section>
        ) : null}

        <div className={styles.actions}>
          <Button to={applyHref}>
            Apply for this role
          </Button>
          <Button to={routePaths.careers} variant="secondary">
            All careers
          </Button>
        </div>
      </PageShell>
    </>
  )
}
