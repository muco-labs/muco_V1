import { CTA } from '@/components/ui/CTA'
import { finalCta } from '@/data/home-content'
import { routePaths } from '@/config/routes'
import { homeSectionIds } from '@/data/home-sections'

export function FinalCTASection() {
  return (
    <div id={homeSectionIds.finalCta}>
      <CTA
        title={finalCta.headline}
        description={finalCta.subcopy}
        primaryLabel={finalCta.primary}
        primaryTo={routePaths.contact}
        secondaryLabel={finalCta.secondary}
        secondaryTo={routePaths.contact}
      />
    </div>
  )
}
