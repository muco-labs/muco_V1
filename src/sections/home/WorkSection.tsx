import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { routePaths } from '@/config/routes'
import { homeSectionIds } from '@/data/home-sections'

export function WorkSection() {
  return (
    <SectionFrame id={homeSectionIds.work} ariaLabelledBy="work-title">
      <SectionHeading
        eyebrow="Proof"
        title="Selected work"
        description="Case studies and delivery snapshots will live here. The route and section architecture are ready for the next content phase."
      />
      <Button to={routePaths.work} variant="secondary">
        View work index
      </Button>
    </SectionFrame>
  )
}
