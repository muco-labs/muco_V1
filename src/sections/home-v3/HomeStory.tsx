import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { company } from '@/data/company'
import { serviceCategories } from '@/data/services'
import { routePaths, servicePath } from '@/config/routes'
import styles from './HomeStory.module.css'

const capabilities = [
  {
    title: 'Build',
    body: 'Websites, software, commerce, mobile and SaaS—engineered to ship.',
    href: routePaths.services,
  },
  {
    title: 'Design',
    body: 'Product experiences and brand systems with editorial clarity.',
    href: routePaths.services,
  },
  {
    title: 'Automate',
    body: 'AI and workflow automation with human oversight built in.',
    href: servicePath('automation'),
  },
  {
    title: 'Grow',
    body: 'SEO and marketing systems tied to product—not isolated campaigns.',
    href: servicePath('seo'),
  },
]

export function HomeStorySections() {
  return (
    <>
      <section className="section section--tight" aria-labelledby="what-title">
        <div className="shell">
          <Reveal className={styles.split}>
            <div>
              <p className="text-label">What MUCO LABS does</p>
              <h2 id="what-title" className="text-h1">
                A technology company—not a slide deck factory.
              </h2>
            </div>
            <p className={styles.body}>{company.positioning}</p>
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="cap-title">
        <div className="shell">
          <Reveal>
            <p className="text-label">Capability ecosystem</p>
            <h2 id="cap-title" className="text-h2">
              Four disciplines. One delivery standard.
            </h2>
          </Reveal>
          <div className={styles.capGrid}>
            {capabilities.map((item, index) => (
              <Reveal key={item.title} delayMs={index * 80}>
                <Link to={item.href} className={`surface surface--lift ${styles.capItem}`}>
                  <span className={styles.capIndex}>0{index + 1}</span>
                  <h3 className="text-h3">{item.title}</h3>
                  <p>{item.body}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="svc-title">
        <div className="shell">
          <Reveal className={styles.servicesHead}>
            <div>
              <p className="text-label">Selected services</p>
              <h2 id="svc-title" className="text-h2">
                Everything you need to build and grow—organized.
              </h2>
            </div>
            <Link className="link-underline" to={routePaths.services}>
              View full ecosystem
            </Link>
            <Link className="link-underline" to={routePaths.insights}>
              Insights
            </Link>
          </Reveal>
          <div className={styles.serviceColumns}>
            {serviceCategories.slice(0, 4).map((category) => (
              <Reveal key={category.id}>
                <article className={styles.serviceCol}>
                  <h3 className="text-label">{category.title}</h3>
                  <ul>
                    {category.offerings.slice(0, 4).map((offering) => (
                      <li key={offering.id}>
                        {offering.slug ? (
                          <Link to={servicePath(offering.slug)}>{offering.title}</Link>
                        ) : (
                          <span>{offering.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
