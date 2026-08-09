import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { industrySolutionSlugs, industrySolutions, industrySolutionPath } from '@/content/solutions/industries'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import styles from './ErodePage.module.css'

const solutions = pageSeo.solutions

export function SolutionsPage() {
  return (
    <>
      <PageMeta
        documentTitle={solutions.documentTitle}
        description={solutions.description}
        path={solutions.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Solutions', path: solutions.path },
        ]}
      />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className="shell">
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={routePaths.home}>Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Solutions</span>
            </nav>
            <Reveal>
              <h1 className="text-display">Solutions by industry</h1>
              <p className={styles.lead}>
                Outcome-focused pages for sectors we work with across India—each with distinct problems,
                approach and service links. For full service detail see the{' '}
                <Link className="link-underline" to={routePaths.services}>
                  services catalog
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </header>

        <section className="section">
          <div className="shell">
            <ul className={styles.serviceLinks}>
              {industrySolutionSlugs.map((slug) => (
                <li key={slug}>
                  <Link className="link-underline" to={industrySolutionPath(slug)}>
                    {industrySolutions[slug].h1}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button
                to={startProjectHref({ source: 'solutions_hub' })}
                trackEvent={analyticsEvents.startProjectClick}
                trackParams={{ source: 'solutions_hub' }}
              >
                Discuss your project
              </Button>
              <Link className="link-underline" to={routePaths.india}>
                India hub
              </Link>
              <Link className="link-underline" to={routePaths.tamilNadu}>
                Tamil Nadu
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
