import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { homeSectionIds } from '@/data/home-sections'

const steps = ['Discover', 'Architect', 'Build', 'Automate', 'Grow']

export function ProcessSection() {
  return (
    <SectionFrame id={homeSectionIds.process} ariaLabelledBy="process-title" tight>
      <SectionHeading
        eyebrow="Delivery"
        title="Process"
        description="A repeatable operating model from discovery through launch and iteration."
      />
      <ol className="home-process">
        {steps.map((step, index) => (
          <li key={step}>
            <span className="home-process__index">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </SectionFrame>
  )
}
