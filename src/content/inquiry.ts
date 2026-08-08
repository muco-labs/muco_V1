import type { ServiceSlug } from '@/config/routes'
import { serviceSlugs } from '@/config/routes'
import { getServiceContent } from '@/data/service-content'

export const budgetRangeOptions = [
  { value: '', label: 'Select budget (optional)' },
  { value: 'under-50k', label: 'Under ₹50,000' },
  { value: '50k-150k', label: '₹50,000 – ₹1,50,000' },
  { value: '150k-500k', label: '₹1,50,000 – ₹5,00,000' },
  { value: '500k-plus', label: '₹5,00,000+' },
  { value: 'not-sure', label: 'Not sure yet' },
] as const

export const timelineOptions = [
  { value: '', label: 'Select timeline (optional)' },
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-2-months', label: '1–2 months' },
  { value: '3-6-months', label: '3–6 months' },
  { value: 'flexible', label: 'Flexible / exploring' },
] as const

export const serviceInquiryOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Select service (optional)' },
  ...serviceSlugs.map((slug) => ({
    value: slug,
    label: getServiceContent(slug)?.title ?? slug,
  })),
]

export function serviceLabelForSlug(slug: string | undefined): string | undefined {
  if (!slug) return undefined
  if (!serviceSlugs.includes(slug as ServiceSlug)) return slug
  return getServiceContent(slug as ServiceSlug)?.title ?? slug
}
