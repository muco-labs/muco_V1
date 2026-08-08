import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { routePaths } from '@/config/routes'
import { homeSectionIds } from '@/data/home-sections'
import { serviceGroups, serviceLinkHref } from '@/data/home-content'
import { cn } from '@/utils/cn'
import styles from './ServicesSection.module.css'

export function ServicesSection() {
  const [active, setActive] = useState(0)
  const group = serviceGroups[active]

  return (
    <SectionFrame id={homeSectionIds.services} ariaLabelledBy="services-title">
      <div className={styles.headerRow}>
        <SectionHeading
          eyebrow="Services"
          title="Everything you need to build and grow."
          titleId="services-title"
          description="A complete technology ecosystem—organized so you can find what matters fast."
          className={styles.heading}
        />
        <Button to={routePaths.services} variant="secondary" className={styles.allLink}>
          View all services
        </Button>
      </div>

      <div className={styles.layout}>
        <div className={styles.tabs} role="tablist" aria-label="Service categories">
          {serviceGroups.map((category, index) => (
            <button
              key={category.title}
              type="button"
              role="tab"
              id={`service-tab-${index}`}
              aria-selected={active === index}
              aria-controls={`service-panel-${index}`}
              className={cn(styles.tab, active === index && styles.tabActive)}
              onClick={() => setActive(index)}
            >
              {category.title}
            </button>
          ))}
        </div>

        <div
          id={`service-panel-${active}`}
          role="tabpanel"
          aria-labelledby={`service-tab-${active}`}
          className={styles.panel}
        >
          <h3 className={styles.panelTitle}>{group.title}</h3>
          <ul className={styles.list}>
            {group.items.map((item) => {
              const href = serviceLinkHref(item)
              return (
                <li key={item.label}>
                  {href ? (
                    <Link to={href} className={styles.serviceLink}>
                      <span>{item.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <span className={styles.serviceSoon}>{item.label}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className={styles.compactGrid} aria-label="All service categories">
        {serviceGroups.map((category) => (
          <div key={category.title} className={`interactive-card ${styles.compactCard}`}>
            <h3 className={styles.compactTitle}>{category.title}</h3>
            <ul className={styles.compactList}>
              {category.items.map((item) => {
                const href = serviceLinkHref(item)
                return (
                  <li key={item.label}>
                    {href ? <Link to={href}>{item.label}</Link> : <span>{item.label}</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}
