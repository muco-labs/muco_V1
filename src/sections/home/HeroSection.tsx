import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SectionFrame } from '@/components/sections/SectionFrame'
import { site } from '@/config/site'
import { routePaths } from '@/config/routes'
import { homeSectionIds } from '@/data/home-sections'
import styles from './HeroSection.module.css'

export function HeroSection() {
  return (
    <SectionFrame id={homeSectionIds.hero} ariaLabelledBy="hero-title">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <Badge>Technology partner</Badge>
          <h1 id="hero-title" className={styles.title}>
            {site.name}
          </h1>
          <p className={styles.lead}>{site.positioning}</p>
          <div className={styles.actions}>
            <Button to={routePaths.contact} size="lg">
              Start a Project
            </Button>
            <Button to={routePaths.services} variant="secondary" size="lg">
              Explore services
            </Button>
          </div>
        </div>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.orb} />
          <div className={styles.gridLines} />
        </div>
      </div>
    </SectionFrame>
  )
}
