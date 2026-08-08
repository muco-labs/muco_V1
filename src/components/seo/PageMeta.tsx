import { useEffect } from 'react'
import { env } from '@/config/env'
import { site } from '@/config/site'

export type PageMetaProps = {
  title?: string
  description?: string
  path?: string
  noIndex?: boolean
  ogType?: 'website' | 'article'
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value)
  })
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  )
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

export function PageMeta({
  title,
  description = site.defaultDescription,
  path = '/',
  noIndex = false,
  ogType = 'website',
}: PageMetaProps) {
  const pageTitle = title ? `${title} | ${site.name}` : site.defaultTitle
  const canonical = `${env.siteUrl}${path.startsWith('/') ? path : `/${path}`}`

  useEffect(() => {
    document.title = pageTitle

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: description,
    })

    upsertLink('canonical', canonical)

    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: pageTitle,
    })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    })
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: ogType,
    })
    upsertMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: canonical,
    })
    upsertMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: site.name,
    })
    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    })
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: pageTitle,
    })
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description,
    })

    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow',
    })
  }, [canonical, description, noIndex, ogType, pageTitle])

  return null
}
