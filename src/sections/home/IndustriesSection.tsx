import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { homeSectionIds } from '@/data/home-sections'

const industries = [
  'SaaS & platforms',
  'Commerce',
  'Professional services',
  'Operations-heavy businesses',
]

export function IndustriesSection() {
  return (
    <SectionFrame id={homeSectionIds.industries} ariaLabelledBy="industries-title" tight>
      <SectionHeading
        eyebrow="Markets"
        title="Industries"
        description="Flexible delivery models across product-led and operations-led organizations."
      />
      <ul className="home-tag-grid">
        {industries.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </SectionFrame>
  )
}
