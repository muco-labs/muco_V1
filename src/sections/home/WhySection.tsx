import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { homeSectionIds } from '@/data/home-sections'

const pillars = [
  'Engineering depth with product judgment',
  'Automation and AI integrated into delivery',
  'Growth systems connected to the product surface',
]

export function WhySection() {
  return (
    <SectionFrame id={homeSectionIds.why} ariaLabelledBy="why-title" tight>
      <SectionHeading
        eyebrow="Differentiation"
        title="Why MUCO LABS"
        description="Built for teams that need reliable execution, clear architecture, and room to scale."
      />
      <ul className="home-pill-list">
        {pillars.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </SectionFrame>
  )
}
