const STORAGE_KEY = 'muco_attribution_v1'

export type StoredAttribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  landingPath?: string
  referrerHost?: string
}

export function captureAttributionFromSearch(search: string, pathname: string): void {
  if (typeof sessionStorage === 'undefined') return
  const params = new URLSearchParams(search)
  const hasUtm =
    params.has('utm_source') || params.has('utm_medium') || params.has('utm_campaign')
  if (!hasUtm && !document.referrer) return

  const existing = readAttribution()
  if (existing && !hasUtm) return

  const next: StoredAttribution = {
    ...existing,
    landingPath: existing?.landingPath ?? pathname,
  }

  if (params.get('utm_source')) next.utmSource = params.get('utm_source')!.slice(0, 120)
  if (params.get('utm_medium')) next.utmMedium = params.get('utm_medium')!.slice(0, 120)
  if (params.get('utm_campaign')) next.utmCampaign = params.get('utm_campaign')!.slice(0, 120)

  if (!existing?.referrerHost && document.referrer) {
    try {
      next.referrerHost = new URL(document.referrer).hostname.slice(0, 120)
    } catch {
      /* ignore invalid referrer */
    }
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function readAttribution(): StoredAttribution | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredAttribution
  } catch {
    return null
  }
}

/** Maps attribution to CRM `source` field (max 64 chars, no PII). */
export function leadSourceFromAttribution(pageSource?: string): string {
  const attr = readAttribution()
  if (pageSource?.trim()) {
    const slug = pageSource.trim().slice(0, 40)
    return `website_contact_${slug}`
  }
  if (attr?.utmMedium?.toLowerCase().includes('social')) return 'social'
  if (attr?.utmSource?.toLowerCase().includes('google')) return 'organic_search'
  if (attr?.referrerHost && !attr.referrerHost.includes('mucolabs')) return 'referral'
  return 'website_contact'
}

export function attributionSummaryForLead(): string | undefined {
  const attr = readAttribution()
  if (!attr) return undefined
  const parts: string[] = []
  if (attr.utmSource) parts.push(`utm_source=${attr.utmSource}`)
  if (attr.utmMedium) parts.push(`utm_medium=${attr.utmMedium}`)
  if (attr.utmCampaign) parts.push(`utm_campaign=${attr.utmCampaign}`)
  if (attr.landingPath) parts.push(`landing=${attr.landingPath}`)
  if (!parts.length) return undefined
  return parts.join('; ').slice(0, 200)
}
