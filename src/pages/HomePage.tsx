import { PageMeta } from '@/components/seo/PageMeta'
import { LocalBusinessSchema, OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData'
import { pageSeo } from '@/config/seo'
import { HomeCultureSections } from '@/sections/home-v3/HomeCulture'
import { HomeEngagementSections } from '@/sections/home-v3/HomeEngagement'
import { HomeStorySections } from '@/sections/home-v3/HomeStory'
import { HomeSystemsSections } from '@/sections/home-v3/HomeSystems'
import { SignatureHero } from '@/sections/home-v3/SignatureHero'

const home = pageSeo.home

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
      <SignatureHero />
      <HomeStorySections />
      <HomeCultureSections />
      <HomeSystemsSections />
      <HomeEngagementSections />
    </>
  )
}
