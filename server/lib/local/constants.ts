/** Attribution signals for Erode/TN local reporting — voluntary or explicit page context only. */
export const ERODE_LOCAL_PAGE_PREFIX = '/erode'

export function isErodeAttributedLead(input: {
  businessCity?: string | null
  landingPath?: string | null
  pageSource?: string | null
  referralSource?: string | null
}): boolean {
  const city = input.businessCity?.trim().toLowerCase()
  if (city === 'erode' || city?.includes('erode')) return true
  if (input.landingPath?.toLowerCase().startsWith(ERODE_LOCAL_PAGE_PREFIX)) return true
  const page = input.pageSource?.toLowerCase() ?? ''
  if (page.includes('erode')) return true
  const ref = input.referralSource?.toLowerCase() ?? ''
  if (ref.includes('erode')) return true
  return false
}

export function isTamilNaduAttributedLead(businessCity?: string | null): boolean {
  const city = businessCity?.trim().toLowerCase()
  if (!city) return false
  if (city === 'erode' || city.includes('tamil')) return true
  const tnCities = ['coimbatore', 'salem', 'tiruppur', 'karur', 'namakkal', 'chennai']
  return tnCities.some((c) => city.includes(c))
}
