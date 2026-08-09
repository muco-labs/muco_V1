import { serializeJsonLd } from '@/utils/json-ld'
import { company } from '@/data/company'
import { founder } from '@/data/founder'
import { env } from '@/config/env'
import { site } from '@/config/site'

type StructuredDataProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}

function verifiedSameAs(): string[] {
  return [
    site.social.linkedin,
    site.social.instagram,
    site.social.x,
    site.social.github,
  ].filter((url) => typeof url === 'string' && url.trim().length > 0)
}

export function OrganizationSchema() {
  const sameAs = verifiedSameAs()
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.legalName,
    url: env.siteUrl,
    logo: `${env.siteUrl}/favicon.svg`,
    description: site.defaultDescription,
    email: site.contactEmail,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.location.city,
      addressRegion: company.location.region,
      addressCountry: company.location.country,
    },
  }

  if (sameAs.length > 0) {
    data.sameAs = sameAs
  }

  data.contactPoint = {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: site.contactEmail,
    telephone: site.contactPhone,
    areaServed: ['IN', 'IN-TN'],
    availableLanguage: ['English', 'Tamil'],
  }

  if (founder.status === 'published' && founder.name) {
    data.founder = {
      '@type': 'Person',
      name: founder.name,
      ...(founder.title ? { jobTitle: founder.title } : {}),
    }
  }

  return <StructuredData data={data} />
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
        telephone: site.contactPhone,
        description: site.defaultDescription,
        image: `${env.siteUrl}/og/og-default.svg`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: company.location.city,
          addressRegion: company.location.region,
          postalCode: company.location.postalCode,
          addressCountry: company.location.country,
        },
        areaServed: ['Erode', 'Tamil Nadu', 'India'],
      }}
    />
  )
}

export function PersonSchema({
  name,
  jobTitle,
  description,
  url,
}: {
  name: string
  jobTitle: string
  description?: string
  url: string
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        jobTitle,
        ...(description ? { description } : {}),
        url,
        worksFor: {
          '@type': 'Organization',
          name: site.legalName,
          url: env.siteUrl,
        },
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
          url: env.siteUrl,
        },
        areaServed: {
          '@type': 'City',
          name: company.location.city,
        },
        url,
      }}
    />
  )
}

export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; path: string }>
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${env.siteUrl}${item.path}`,
        })),
      }}
    />
  )
}

export function FaqPageSchema({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>
}) {
  if (faqs.length === 0) return null

  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  )
}

/** For future /insights articles — use only when real content exists. */
export function ArticleSchema({
  headline,
  description,
  path,
  datePublished,
  dateModified,
}: {
  headline: string
  description: string
  path: string
  datePublished: string
  dateModified?: string
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        description,
        author: {
          '@type': 'Organization',
          name: site.legalName,
        },
        publisher: {
          '@type': 'Organization',
          name: site.legalName,
          logo: {
            '@type': 'ImageObject',
            url: `${env.siteUrl}/favicon.svg`,
          },
        },
        mainEntityOfPage: `${env.siteUrl}${path}`,
        datePublished,
        dateModified: dateModified ?? datePublished,
      }}
    />
  )
}

const jobPostingEmploymentMap: Record<string, string> = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  internship: 'INTERN',
  contract: 'CONTRACTOR',
}

/** Use only for real published job openings from the database. */
export function JobPostingSchema({
  title,
  description,
  url,
  employmentType,
  datePosted,
  validThrough,
  hiringOrganization,
}: {
  title: string
  description: string
  url: string
  employmentType: string
  datePosted?: string
  validThrough?: string
  hiringOrganization: { name: string; sameAs: string }
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    url,
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrganization.name,
      sameAs: hiringOrganization.sameAs,
    },
    employmentType: jobPostingEmploymentMap[employmentType] ?? employmentType,
  }

  if (datePosted) data.datePosted = datePosted
  if (validThrough) data.validThrough = validThrough

  return <StructuredData data={data} />
}
