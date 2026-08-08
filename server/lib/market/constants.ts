/** Market attribution — voluntary geo and explicit landing paths only (no IP). */
export const ERODE_PAGE_PREFIX = '/erode'
export const TAMIL_NADU_PAGE_PREFIX = '/tamil-nadu'
export const INDIA_PAGE_PREFIX = '/india'

export const TAMIL_NADU_CITY_HINTS = [
  'erode',
  'coimbatore',
  'chennai',
  'madurai',
  'salem',
  'trichy',
  'tiruchir',
  'tiruppur',
  'tirunelveli',
  'hosur',
  'karur',
  'namakkal',
  'thanjavur',
  'vellore',
] as const

export const TAMIL_NADU_STATE_HINTS = ['tamil nadu', 'tamilnadu', 'tn'] as const

/** Major non-TN Indian metros (voluntary city field). */
export const INDIA_METRO_CITY_HINTS = [
  'bengaluru',
  'bangalore',
  'mumbai',
  'delhi',
  'new delhi',
  'hyderabad',
  'pune',
  'ahmedabad',
  'kolkata',
  'jaipur',
  'lucknow',
  'kochi',
  'noida',
  'gurugram',
  'gurgaon',
] as const

export const INDIA_STATE_HINTS = [
  'andhra pradesh',
  'arunachal pradesh',
  'assam',
  'bihar',
  'chhattisgarh',
  'goa',
  'gujarat',
  'haryana',
  'himachal pradesh',
  'jharkhand',
  'karnataka',
  'kerala',
  'madhya pradesh',
  'maharashtra',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'odisha',
  'punjab',
  'rajasthan',
  'sikkim',
  'telangana',
  'tripura',
  'uttar pradesh',
  'uttarakhand',
  'west bengal',
  'tamil nadu',
  'tamilnadu',
] as const

export type MarketLocality = 'erode' | 'tamil_nadu' | 'india'

function norm(value?: string | null): string {
  return value?.trim().toLowerCase() ?? ''
}

export function matchesTamilNaduCity(city?: string | null): boolean {
  const c = norm(city)
  if (!c) return false
  return TAMIL_NADU_CITY_HINTS.some((hint) => c.includes(hint))
}

export function matchesTamilNaduState(state?: string | null): boolean {
  const s = norm(state)
  if (!s) return false
  return TAMIL_NADU_STATE_HINTS.some((hint) => s.includes(hint))
}

export function matchesIndiaMetroCity(city?: string | null): boolean {
  const c = norm(city)
  if (!c) return false
  return INDIA_METRO_CITY_HINTS.some((hint) => c.includes(hint))
}

export function matchesIndiaState(state?: string | null): boolean {
  const s = norm(state)
  if (!s) return false
  return INDIA_STATE_HINTS.some((hint) => s.includes(hint))
}

export function isErodeAttributedLead(input: {
  businessCity?: string | null
  landingPath?: string | null
  pageSource?: string | null
  referralSource?: string | null
}): boolean {
  const city = norm(input.businessCity)
  if (city.includes('erode')) return true
  const landing = norm(input.landingPath)
  if (landing.startsWith(ERODE_PAGE_PREFIX)) return true
  const page = norm(input.pageSource)
  if (page.includes('erode')) return true
  const ref = norm(input.referralSource)
  if (ref.includes('erode')) return true
  return false
}

export function isTamilNaduAttributedLead(input: {
  businessCity?: string | null
  businessState?: string | null
  landingPath?: string | null
  pageSource?: string | null
}): boolean {
  if (matchesTamilNaduCity(input.businessCity) || matchesTamilNaduState(input.businessState)) {
    return true
  }
  const landing = norm(input.landingPath)
  if (landing.startsWith(TAMIL_NADU_PAGE_PREFIX)) return true
  const page = norm(input.pageSource)
  if (page.includes('tamil_nadu') || page.includes('tamil-nadu')) return true
  return false
}

export function isIndiaAttributedLead(input: {
  businessCity?: string | null
  businessState?: string | null
  landingPath?: string | null
  pageSource?: string | null
}): boolean {
  if (isTamilNaduAttributedLead(input)) return true
  if (matchesIndiaMetroCity(input.businessCity) || matchesIndiaState(input.businessState)) {
    return true
  }
  const landing = norm(input.landingPath)
  if (landing.startsWith(INDIA_PAGE_PREFIX)) return true
  const page = norm(input.pageSource)
  if (page.startsWith('india_') || page === 'india') return true
  return false
}
