import { Link } from 'react-router-dom'
import { ConceptWorkCard } from '@/components/home/ConceptWorkCard'
import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { conceptWork } from '@/data/home-content'
import { homeSectionIds } from '@/data/home-sections'
import { routePaths } from '@/config/routes'
import styles from './WorkSection.module.css'

export function WorkSection() {
  return (
    <SectionFrame id={homeSectionIds.work} ariaLabelledBy="work-title">
      <SectionHeading
        eyebrow="Portfolio"
        title="Concept work"
        titleId="work-title"
        description="Explorations and internal concepts—clearly labelled until client case studies are ready to publish."
      />
      <div className={styles.grid}>
        {conceptWork.map((project) => (
          <ConceptWorkCard key={project.id} {...project} />
        ))}
      </div>
      <p className={styles.note}>
        Interested in how we approach delivery?{' '}
        <Link to={routePaths.work} className="text-link">
          Visit the work index
        </Link>{' '}
        or{' '}
        <Link to={routePaths.contact} className="text-link">
          start a conversation
        </Link>
        .
      </p>
    </SectionFrame>
  )
}
