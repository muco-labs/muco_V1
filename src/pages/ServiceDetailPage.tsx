import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageShell } from '@/layouts/PageShell'
import { routePaths } from '@/config/routes'
import { getServiceBySlug } from '@/data/services'

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const service = slug ? getServiceBySlug(slug) : undefined

  if (!service) {
    return <Navigate to="/404" replace />
  }

  return (
    <PageShell
      title={service.title}
      path={`/services/${service.slug}`}
      description={`${service.title} by MUCO LABS. Detailed service narrative, deliverables, and proof will be added in the next content phase.`}
    >
      <p>
        This route is wired for SEO, navigation, and future long-form service content.
      </p>
      <Button to={routePaths.contact}>Start a Project</Button>
      <p>
        <Link to={routePaths.services}>All services</Link>
      </p>
    </PageShell>
  )
}
