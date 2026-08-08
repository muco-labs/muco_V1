import { Link } from 'react-router-dom'
import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { homeSectionIds } from '@/data/home-sections'
import {
  resolveOfferingHref,
  serviceCategories,
} from '@/data/services'
import styles from './ServicesSection.module.css'

export function ServicesSection() {
  return (
    <SectionFrame id={homeSectionIds.services} ariaLabelledBy="home-services-title">
      <SectionHeading
        eyebrow="Capabilities"
        title="Services"
        titleId="home-services-title"
        description="Organized by how teams actually buy and scale technology work."
      />
      <div className={styles.grid}>
        {serviceCategories.map((category) => (
          <Card key={category.id} as="article" className={styles.card}>
            <h3 className={styles.category}>{category.title}</h3>
            <ul className={styles.list}>
              {category.offerings.map((offering) => {
                const href = resolveOfferingHref(offering)
                return (
                  <li key={offering.id}>
                    {href ? (
                      <Link to={href} className={styles.link}>
                        {offering.title}
                      </Link>
                    ) : (
                      <span className={styles.pending}>{offering.title}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </div>
    </SectionFrame>
  )
}
