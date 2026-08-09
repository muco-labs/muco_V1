import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { CareerApplicationForm } from '@/components/careers/CareerApplicationForm'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { fetchCareerJobApplyContext } from '@/services/careers'

const seo = pageSeo.careersApply

export function CareersApplyPage() {
  const [params] = useSearchParams()
  const isGeneral = params.get('type') === 'general'
  const jobSlug = isGeneral ? undefined : (params.get('job') ?? undefined)

  const [jobContext, setJobContext] = useState<{
    title: string
    acceptingApplications: boolean
    message: string | null
  } | null>(null)
  const [jobLoading, setJobLoading] = useState(Boolean(jobSlug))
  const [jobError, setJobError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobSlug) {
      setJobContext(null)
      setJobLoading(false)
      return
    }
    let cancelled = false
    setJobLoading(true)
    fetchCareerJobApplyContext(jobSlug)
      .then((ctx) => {
        if (!cancelled) {
          setJobContext({
            title: ctx.title,
            acceptingApplications: ctx.acceptingApplications,
            message: ctx.message,
          })
          setJobError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJobContext(null)
          setJobError('This job opening could not be found.')
        }
      })
      .finally(() => {
        if (!cancelled) setJobLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [jobSlug])

  const defaults = useMemo(
    () => ({
      defaultRoleInterest: isGeneral ? 'General Application' : '',
      defaultApplicationType: isGeneral ? 'general' : 'full_time',
    }),
    [isGeneral],
  )

  const blockForm =
    Boolean(jobSlug) && !jobLoading && jobContext && !jobContext.acceptingApplications

  return (
    <PageShell
      title="Apply"
      documentTitle={seo.documentTitle}
      path={seo.path}
      description={seo.description}
    >
      {jobLoading ? (
        <p role="status">Checking job availability…</p>
      ) : null}
      {jobError ? (
        <p role="alert">
          {jobError}{' '}
          <Link className="link-underline" to={routePaths.careersApply}>
            Submit a general application
          </Link>
        </p>
      ) : null}
      {blockForm ? (
        <div className="surface" style={{ padding: 'var(--space-5)', maxWidth: '40rem' }}>
          <h2 className="text-h3">{jobContext?.title}</h2>
          <p>{jobContext?.message ?? 'This position is no longer accepting applications.'}</p>
          <p>
            <Link className="link-underline" to={`${routePaths.careersApply}?type=general`}>
              General application
            </Link>{' '}
            ·{' '}
            <Link className="link-underline" to={routePaths.careers}>
              View Careers
            </Link>
          </p>
        </div>
      ) : (
        <CareerApplicationForm
          jobOpeningSlug={jobSlug && jobContext?.acceptingApplications !== false ? jobSlug : undefined}
          jobTitle={jobContext?.title}
          {...defaults}
        />
      )}
    </PageShell>
  )
}
