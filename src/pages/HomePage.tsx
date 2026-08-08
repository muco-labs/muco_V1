import { PageMeta } from '@/components/seo/PageMeta'
import { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData'
import { FinalCTASection } from '@/sections/home/FinalCTASection'
import { HeroSection } from '@/sections/home/HeroSection'
import { IndustriesSection } from '@/sections/home/IndustriesSection'
import { ProcessSection } from '@/sections/home/ProcessSection'
import { ProofSection } from '@/sections/home/ProofSection'
import { ServicesSection } from '@/sections/home/ServicesSection'
import { TechnologySection } from '@/sections/home/TechnologySection'
import { WhatWeDoSection } from '@/sections/home/WhatWeDoSection'
import { WhySection } from '@/sections/home/WhySection'
import { WorkSection } from '@/sections/home/WorkSection'

export function HomePage() {
  return (
    <>
      <PageMeta path="/" />
      <OrganizationSchema />
      <WebSiteSchema />
      <HeroSection />
      <WhatWeDoSection />
      <ServicesSection />
      <WhySection />
      <WorkSection />
      <ProcessSection />
      <TechnologySection />
      <IndustriesSection />
      <ProofSection />
      <FinalCTASection />
    </>
  )
}
