import { SectionFrame } from '@/components/sections/SectionFrame'
import { homeSectionIds } from '@/data/home-sections'
import { intro } from '@/data/home-content'
import styles from './IntroSection.module.css'

export function IntroSection() {
  return (
    <SectionFrame
      id={homeSectionIds.intro}
      ariaLabelledBy="intro-title"
      tight
      className={styles.section}
    >
      <div className={styles.inner}>
        <h2 id="intro-title" className={styles.headline}>
          {intro.headline}
        </h2>
        <p className={styles.body}>{intro.body}</p>
      </div>
    </SectionFrame>
  )
}
