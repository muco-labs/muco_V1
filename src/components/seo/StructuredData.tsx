import { env } from '@/config/env'
import { site } from '@/config/site'

type StructuredDataProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationSchema() {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site.legalName,
        url: env.siteUrl,
        description: site.defaultDescription,
        email: site.contactEmail,
      }}
    />
  )
}

export function WebSiteSchema() {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: env.siteUrl,
        publisher: {
          '@type': 'Organization',
          name: site.legalName,
        },
      }}
    />
  )
}
