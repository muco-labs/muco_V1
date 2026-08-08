import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { homeSectionIds } from '@/data/home-sections'

export function ProofSection() {
  return (
    <SectionFrame id={homeSectionIds.proof} ariaLabelledBy="proof-title" tight>
      <SectionHeading
        eyebrow="Trust"
        title="Testimonials & proof"
        description="Client stories, metrics, and certifications will be added with verified assets in the next phase."
      />
    </SectionFrame>
  )
}
