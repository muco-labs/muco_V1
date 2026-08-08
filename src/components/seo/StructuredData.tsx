import { company } from '@/data/company'
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

export function LocalBusinessSchema() {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: site.legalName,
        url: env.siteUrl,
        email: site.contactEmail,
        description: site.defaultDescription,
        address: {
          '@type': 'PostalAddress',
          addressLocality: company.location.city,
          addressRegion: company.location.region,
          addressCountry: company.location.country,
        },
        areaServed: ['Erode', 'Tamil Nadu', 'India'],
      }}
    />
  )
}

export function ServiceSchema({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description,
        provider: {
          '@type': 'Organization',
          name: site.legalName,
        },
        url,
      }}
    />
  )
}
