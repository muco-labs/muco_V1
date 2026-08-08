import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { processStages } from '@/data/home-content'
import { homeSectionIds } from '@/data/home-sections'
import styles from './ProcessSection.module.css'

export function ProcessSection() {
  return (
    <SectionFrame
      id={homeSectionIds.process}
      ariaLabelledBy="process-title"
      tight
      className={styles.section}
    >
      <SectionHeading
        eyebrow="How we work"
        title="From idea to impact."
        titleId="process-title"
        description="A clear path from discovery through launch and growth."
      />
      <ol className={styles.timeline}>
        {processStages.map((stage, index) => (
          <li key={stage.index} className={styles.step}>
            <div className={styles.marker} aria-hidden="true">
              <span>{stage.index}</span>
              {index < processStages.length - 1 ? <span className={styles.line} /> : null}
            </div>
            <div className={styles.content}>
              <h3 className={styles.title}>{stage.title}</h3>
              <p className={styles.body}>{stage.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionFrame>
  )
}
