import { CapabilityCard } from '@/components/home/CapabilityCard'
import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { capabilities } from '@/data/home-content'
import { homeSectionIds } from '@/data/home-sections'
import styles from './CapabilitiesSection.module.css'

export function CapabilitiesSection() {
  return (
    <SectionFrame
      id={homeSectionIds.capabilities}
      ariaLabelledBy="capabilities-title"
    >
      <SectionHeading
        eyebrow="Core capabilities"
        title="What we deliver"
        titleId="capabilities-title"
        description="Four disciplines—one team—for products that need to ship and scale."
      />
      <div className={styles.grid}>
        {capabilities.map((item) => (
          <CapabilityCard key={item.id} {...item} />
        ))}
      </div>
    </SectionFrame>
  )
}
