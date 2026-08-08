import { Link } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { insightTopics, insightsIntro } from '@/content/insights'
import { insightCategories, insightArticles } from '@/data/insights'
import styles from './InsightsPage.module.css'

const insights = pageSeo.insights

export function InsightsPage() {
  return (
    <PageShell
      title="Insights"
      documentTitle={insights.documentTitle}
      path={insights.path}
      description="Editorial roadmap for web development, software, AI, SEO and digital marketing from MUCO LABS."
      noIndex
    >
      <p className={styles.intro}>{insightsIntro}</p>
      <section className={styles.topics} aria-labelledby="topics-title">
        <h2 id="topics-title" className="text-h3">
          Topics in progress
        </h2>
        <div className={styles.topicGrid}>
          {insightTopics.map((topic) => (
            <article key={topic.id} className="surface">
              <h3 className="text-label">{topic.title}</h3>
              <p>{topic.description}</p>
            </article>
          ))}
        </div>
      </section>
      <p className={styles.categories}>
        Planned categories: {insightCategories.join(' · ')}
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
          while the first articles are prepared.
        </p>
      ) : null}
    </PageShell>
  )
}
