import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { whyPrinciples } from '@/data/home-content'
import { homeSectionIds } from '@/data/home-sections'
import styles from './WhySection.module.css'

export function WhySection() {
  return (
    <SectionFrame
      id={homeSectionIds.why}
      ariaLabelledBy="why-title"
      tight
      className={styles.section}
    >
      <SectionHeading
        eyebrow="Why MUCO LABS"
        title="Why MUCO LABS?"
        titleId="why-title"
        description="Principles we hold ourselves to on every engagement."
      />
      <ul className={styles.grid}>
        {whyPrinciples.map((item) => (
          <li key={item.index} className={`interactive-card ${styles.item}`}>
            <span className={styles.index}>{item.index}</span>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.body}>{item.body}</p>
          </li>
        ))}
      </ul>
    </SectionFrame>
  )
}
