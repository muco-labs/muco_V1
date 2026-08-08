import { Link } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { insightArticles, insightCategories } from '@/data/insights'

const insights = pageSeo.insights

export function InsightsPage() {
  return (
    <PageShell
      title="Insights"
      documentTitle={insights.documentTitle}
      path={insights.path}
      description="Articles and guides on web development, software, AI, automation, SEO and digital marketing—published as the MUCO LABS content engine grows."
    >
      <p>
        We are preparing editorial content across{' '}
        {insightCategories.slice(0, 5).join(', ')} and more. Only published articles will be
        indexed—no empty category pages.
      </p>
      {insightArticles.length === 0 ? (
        <p>
          <Link className="link-underline" to={routePaths.services}>
            Explore services
          </Link>{' '}
          or{' '}
          <Link className="link-underline" to={routePaths.contact}>
            start a project
          </Link>{' '}
          while the first posts are in progress.
        </p>
      ) : null}
    </PageShell>
  )
}
