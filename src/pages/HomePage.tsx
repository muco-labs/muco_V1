import { PageMeta } from '@/components/seo/PageMeta'
import { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData'
import { CapabilitiesSection } from '@/sections/home/CapabilitiesSection'
import { FinalCTASection } from '@/sections/home/FinalCTASection'
import { HeroSection } from '@/sections/home/HeroSection'
import { IndustriesSection } from '@/sections/home/IndustriesSection'
import { IntroSection } from '@/sections/home/IntroSection'
import { LocalPositioningSection } from '@/sections/home/LocalPositioningSection'
import { ProcessSection } from '@/sections/home/ProcessSection'
import { ServicesSection } from '@/sections/home/ServicesSection'
import { TechnologySection } from '@/sections/home/TechnologySection'
import { WhySection } from '@/sections/home/WhySection'
import { WorkSection } from '@/sections/home/WorkSection'

export function HomePage() {
  return (
    <>
      <PageMeta path="/" />
      <OrganizationSchema />
      <WebSiteSchema />
      <HeroSection />
      <IntroSection />
      <CapabilitiesSection />
      <ServicesSection />
      <WhySection />
      <WorkSection />
      <ProcessSection />
      <TechnologySection />
      <IndustriesSection />
      <LocalPositioningSection />
      <FinalCTASection />
    </>
  )
}
