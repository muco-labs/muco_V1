import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { industries } from '@/data/home-content'
import { homeSectionIds } from '@/data/home-sections'
import styles from './IndustriesSection.module.css'

export function IndustriesSection() {
  return (
    <SectionFrame
      id={homeSectionIds.industries}
      ariaLabelledBy="industries-title"
      tight
    >
      <SectionHeading
        eyebrow="Industries"
        title="Breadth without clutter"
        titleId="industries-title"
        description="We adapt delivery models across sectors—without forcing one-size-fits-all templates."
      />
      <ul className={styles.grid}>
        {industries.map((industry) => (
          <li key={industry} className={styles.chip}>
            {industry}
          </li>
        ))}
      </ul>
    </SectionFrame>
  )
}
