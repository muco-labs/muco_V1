import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { PageShell } from '@/layouts/PageShell'
import {
  resolveOfferingHref,
  serviceCategories,
} from '@/data/services'
import styles from './ServicesPage.module.css'

export function ServicesPage() {
  return (
    <PageShell
      title="Services"
      path="/services"
      description="Build, design, automate, grow, and operate—organized for clarity as the commercial catalog evolves."
    >
      <div className={styles.grid}>
        {serviceCategories.map((category) => (
          <Card key={category.id} as="section" className={styles.card}>
            <h2 className={styles.categoryTitle}>{category.title}</h2>
            <ul className={styles.list}>
              {category.offerings.map((offering) => {
                const href = resolveOfferingHref(offering)
                return (
                  <li key={offering.id}>
                    {href ? (
                      <Link to={href}>{offering.title}</Link>
                    ) : (
                      <span className={styles.soon}>{offering.title}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
