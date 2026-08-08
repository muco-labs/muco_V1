import { SectionFrame } from '@/components/sections/SectionFrame'
import { localPositioning } from '@/data/home-content'
import { homeSectionIds } from '@/data/home-sections'
import styles from './LocalPositioningSection.module.css'

export function LocalPositioningSection() {
  return (
    <SectionFrame
      id={homeSectionIds.local}
      ariaLabelledBy="local-title"
      tight
      className={styles.section}
    >
      <div className={styles.card}>
        <p className={styles.eyebrow}>{localPositioning.eyebrow}</p>
        <h2 id="local-title" className={styles.title}>
          {localPositioning.headline}
        </h2>
        <p className={styles.body}>{localPositioning.body}</p>
      </div>
    </SectionFrame>
  )
}
