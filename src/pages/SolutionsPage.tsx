import { Link } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'

const solutions = pageSeo.solutions

export function SolutionsPage() {
  return (
    <PageShell
      title="Solutions"
      documentTitle={solutions.documentTitle}
      path={solutions.path}
      description={solutions.description}
      noIndex
    >
      <p>
        Outcome-based packages are being mapped to the services catalog. Meanwhile, explore{' '}
        <Link className="link-underline" to={routePaths.services}>
          services
        </Link>{' '}
        or{' '}
        <Link className="link-underline" to={routePaths.contact}>
          contact MUCO LABS
        </Link>{' '}
        to scope a solution for your team.
      </p>
    </PageShell>
  )
}
