import { useEffect } from 'react'
import { env } from '@/config/env'
import { absoluteOgImageUrl, defaultOgImagePath } from '@/config/seo'
import { site } from '@/config/site'

export type PageMetaProps = {
  /** Full document title (preferred). */
  documentTitle?: string
  /** Short title segment; combined as `{title} | {site.name}` when documentTitle is omitted. */
  title?: string
  description?: string
  path?: string
  noIndex?: boolean
  ogType?: 'website' | 'article'
  ogImagePath?: string
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

function resolvePageTitle(documentTitle?: string, title?: string): string {
  if (documentTitle) return documentTitle
  if (title) return `${title} | ${site.name}`
  return site.defaultTitle
}

export function PageMeta({
  documentTitle,
  title,
  description = site.defaultDescription,
  path = '/',
  noIndex = false,
  ogType = 'website',
  ogImagePath = defaultOgImagePath,
}: PageMetaProps) {
  const pageTitle = resolvePageTitle(documentTitle, title)
  const canonical = `${env.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
  const ogImage = absoluteOgImageUrl(env.siteUrl, ogImagePath)

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
    upsertMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: ogImage,
    })
    upsertMeta('meta[property="og:image:alt"]', {
      property: 'og:image:alt',
      content: `${site.name} — technology, software, AI and digital solutions`,
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
    upsertMeta('meta[property="og:locale"]', {
      property: 'og:locale',
      content: site.locale,
    })

    upsertMeta('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: ogImage,
    })
    upsertMeta('meta[name="twitter:site"]', {
      name: 'twitter:site',
      content: '@muco_labs',
    })

    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow',
    })

    if (env.gscVerification) {
      upsertMeta('meta[name="google-site-verification"]', {
        name: 'google-site-verification',
        content: env.gscVerification,
      })
    }
  }, [canonical, description, noIndex, ogImage, ogType, pageTitle])

  return null
}
