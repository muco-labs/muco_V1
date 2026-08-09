import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { Button } from '@/components/ui/Button'
import { pageSeo } from '@/config/seo'
import { careerDepartments, careersIntro } from '@/content/careers'
import { routePaths, careersOpeningPath } from '@/config/routes'
import { fetchCareerOpenings, type CareerJobOpeningSummary } from '@/services/careers'
import styles from './CareersPage.module.css'

const seo = pageSeo.careers

export function CareersPage() {
  const [openings, setOpenings] = useState<CareerJobOpeningSummary[] | null>(null)
  const [openingsError, setOpeningsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCareerOpenings()
      .then((items) => {
        if (!cancelled) setOpenings(items)
      })
      .catch(() => {
        if (!cancelled) {
          setOpenings([])
          setOpeningsError('Open roles could not be loaded right now.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const openingsLoading = openings === null

  return (
    <PageShell
      title="Careers"
      documentTitle={seo.documentTitle}
      path={seo.path}
      description={seo.description}
    >
      <p className={styles.lead}>{careersIntro.headline}</p>
      <p className={styles.lead}>{careersIntro.process}</p>

      <div className={styles.actions}>
        <Button to={routePaths.careersApply}>
          Submit an application
        </Button>
      </div>

      <section className={styles.section} aria-labelledby="careers-openings">
        <h2 id="careers-openings" className="text-h2">
          Open roles
        </h2>
        {openingsLoading ? (
          <p className={styles.muted} role="status">
            Loading open roles…
          </p>
        ) : null}
        {openingsError ? <p className={styles.muted}>{openingsError}</p> : null}
        {!openingsLoading && openings && openings.length === 0 ? (
          <p className={styles.muted}>
            There are no published openings at the moment. You can still{' '}
            <Link className="link-underline" to={routePaths.careersApply}>
              send a general application
            </Link>{' '}
            for consideration.
          </p>
        ) : null}
        {!openingsLoading && openings && openings.length > 0 ? (
          <ul className={styles.openingList}>
            {openings.map((job) => (
              <li key={job.id}>
                <Link className={`surface ${styles.openingCard}`} to={careersOpeningPath(job.slug)}>
                  <h3 className="text-h3">{job.title}</h3>
                  <p className={styles.meta}>
                    {[job.department, job.employmentType, job.locationLabel, job.remoteStatus]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p>{job.shortDescription}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="careers-areas">
        <h2 id="careers-areas" className="text-h2">
          Areas we hire for
        </h2>
        <p className={styles.muted}>
          These are disciplines and roles we may consider—they are not listings unless shown above as
          open roles.
        </p>
        <div className={styles.deptGrid}>
          {careerDepartments.map((dept) => (
            <article key={dept.id} className={`surface ${styles.deptCard}`}>
              <h3 className="text-h3">{dept.label}</h3>
              <ul>
                {dept.roles.map((role) => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="careers-general">
        <h2 id="careers-general" className="text-h2">
          General application
        </h2>
        <p className={styles.muted}>
          If you do not see a matching opening, share your profile for future consideration. This does
          not guarantee employment.
        </p>
        <Button to={`${routePaths.careersApply}?type=general`} variant="secondary">
          General application
        </Button>
      </section>
    </PageShell>
  )
}
