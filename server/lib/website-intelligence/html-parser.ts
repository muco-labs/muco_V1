import * as cheerio from 'cheerio'

export type ParsedPage = {
  title: string | null
  metaDescription: string | null
  canonical: string | null
  h1Texts: string[]
  headings: Array<{ level: number; text: string }>
  wordCount: number
  internalLinks: string[]
  externalLinks: string[]
  imageCount: number
  imagesMissingAlt: number
  robotsNoindex: boolean
  htmlLang: string | null
  viewportMeta: boolean
  ogPresent: boolean
  twitterCardPresent: boolean
  structuredDataTypes: string[]
  hasMainCta: boolean
}

function visibleText($: cheerio.CheerioAPI): string {
  $('script, style, noscript').remove()
  return $('body').text().replace(/\s+/g, ' ').trim()
}

export function parseHtmlPage(html: string, pageUrl: URL): ParsedPage {
  const $ = cheerio.load(html)
  const title = $('title').first().text().trim() || null
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    null
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || null

  const h1Texts = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)

  const headings: ParsedPage['headings'] = []
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const tag = $(el).prop('tagName')?.toLowerCase() ?? ''
    const level = tag ? Number.parseInt(tag.replace('h', ''), 10) : 0
    const text = $(el).text().trim()
    if (level && text) headings.push({ level, text })
  })

  const text = visibleText($)
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0

  const internalLinks: string[] = []
  const externalLinks: string[] = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim()
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))
      return
    try {
      const resolved = new URL(href, pageUrl)
      if (resolved.hostname.toLowerCase() === pageUrl.hostname.toLowerCase()) {
        internalLinks.push(resolved.toString())
      } else {
        externalLinks.push(resolved.toString())
      }
    } catch {
      /* ignore */
    }
  })

  let imageCount = 0
  let imagesMissingAlt = 0
  $('img').each((_, el) => {
    imageCount += 1
    const alt = $(el).attr('alt')
    if (alt === undefined || alt.trim() === '') imagesMissingAlt += 1
  })

  const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() ?? ''
  const robotsNoindex = robotsMeta.includes('noindex')

  const htmlLang = $('html').attr('lang')?.trim() || null
  const viewportMeta = $('meta[name="viewport"]').length > 0
  const ogPresent = $('meta[property^="og:"]').length > 0
  const twitterCardPresent =
    $('meta[name^="twitter:"]').length > 0 || $('meta[property^="twitter:"]').length > 0

  const structuredDataTypes: string[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html()?.trim()
    if (!raw) return
    try {
      const json = JSON.parse(raw) as { '@type'?: string | string[] }
      const t = json['@type']
      if (typeof t === 'string') structuredDataTypes.push(t)
      if (Array.isArray(t)) structuredDataTypes.push(...t.filter((x) => typeof x === 'string'))
    } catch {
      structuredDataTypes.push('ld+json (unparsed)')
    }
  })

  const ctaPattern = /(buy|shop|contact|get started|sign up|subscribe|add to cart)/i
  const hasMainCta =
    $('a,button').filter((_, el) => ctaPattern.test($(el).text())).length > 0

  return {
    title,
    metaDescription,
    canonical,
    h1Texts,
    headings,
    wordCount,
    internalLinks,
    externalLinks,
    imageCount,
    imagesMissingAlt,
    robotsNoindex,
    htmlLang,
    viewportMeta,
    ogPresent,
    twitterCardPresent,
    structuredDataTypes,
    hasMainCta,
  }
}
