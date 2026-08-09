import { PageMeta } from '@/components/seo/PageMeta'
import {
  FaqPageSchema,
  LocalBusinessSchema,
  OrganizationSchema,
  WebSiteSchema,
} from '@/components/seo/StructuredData'
import { faqs, homeFaqIds } from '@/content/faqs'
import { pageSeo } from '@/config/seo'
import { HomeCultureSections } from '@/sections/home-v3/HomeCulture'
import { HomeEngagementSections } from '@/sections/home-v3/HomeEngagement'
import { FinalCta } from '@/components/design-system/FinalCta'
import { HomeFaqSection } from '@/sections/home-v3/HomeFaq'
import { HomeFounderSpotlight } from '@/sections/home-v3/HomeFounderSpotlight'
import { HomeServicesShowcase } from '@/sections/home-v3/HomeServicesShowcase'
import {
  HomeHowWeWorkSection,
  HomeLocalErodeSection,
  HomeTechnologySection,
  HomeWorkPreviewSection,
} from '@/sections/home-v3/HomeSystems'
import { HomeTeamSection } from '@/sections/home-v3/HomeTeam'
import { SignatureHero } from '@/sections/home-v3/SignatureHero'

const home = pageSeo.home

const homeFaqs = homeFaqIds
  .map((id) => faqs.find((f) => f.id === id))
  .filter((f): f is (typeof faqs)[number] => Boolean(f))
  .map((f) => ({ question: f.question, answer: f.answer }))

export function HomePage() {
  return (
    <>
      <PageMeta
        documentTitle={home.documentTitle}
        description={home.description}
        path={home.path}
      />
      <OrganizationSchema />
      <WebSiteSchema />
      <LocalBusinessSchema />
      <FaqPageSchema faqs={homeFaqs} />
      <SignatureHero />
      <HomeServicesShowcase />
      <HomeCultureSections />
      <HomeHowWeWorkSection />
      <HomeTechnologySection />
      <HomeWorkPreviewSection />
      <HomeFounderSpotlight />
      <HomeTeamSection />
      <HomeEngagementSections />
      <HomeLocalErodeSection />
      <HomeFaqSection />
      <FinalCta source="home_cta" />
    </>
  )
}
