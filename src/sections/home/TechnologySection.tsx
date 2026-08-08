import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { homeSectionIds } from '@/data/home-sections'

export function TechnologySection() {
  return (
    <SectionFrame id={homeSectionIds.technology} ariaLabelledBy="technology-title">
      <SectionHeading
        eyebrow="Systems"
        title="Technology & AI"
        description="Modern stacks, cloud-native delivery, and applied AI where it creates measurable leverage—not novelty."
      />
    </SectionFrame>
  )
}
