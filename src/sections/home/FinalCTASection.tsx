import { CTA } from '@/components/ui/CTA'
import { routePaths } from '@/config/routes'
import { homeSectionIds } from '@/data/home-sections'

export function FinalCTASection() {
  return (
    <div id={homeSectionIds.finalCta}>
      <CTA
        title="Start a project with MUCO LABS"
        description="Share your goals and constraints. We will respond with a clear next step—not a generic pitch deck."
        primaryLabel="Start a Project"
        primaryTo={routePaths.contact}
        secondaryLabel="View services"
        secondaryTo={routePaths.services}
      />
    </div>
  )
}
