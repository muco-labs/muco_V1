import { serviceHighlights } from '@/content/services-catalog'

export const startProjectPaths = {
  entry: '/start-project',
  flow: '/app/start-project',
  success: (requestId: string) => `/app/start-project/success/${requestId}`,
  requests: '/app/project-requests',
} as const

export const budgetPreferenceOptions = [
  { value: 'not_decided', label: 'Not decided' },
  { value: 'under_25k', label: 'Under ₹25,000' },
  { value: '25k_50k', label: '₹25,000–₹50,000' },
  { value: '50k_100k', label: '₹50,000–₹1,00,000' },
  { value: '100k_plus', label: '₹1,00,000+' },
  { value: 'custom', label: 'Custom / Discuss' },
] as const

export const timelinePreferenceOptions = [
  { value: 'asap', label: 'ASAP' },
  { value: '1_2_weeks', label: '1–2 weeks' },
  { value: '2_4_weeks', label: '2–4 weeks' },
  { value: '1_2_months', label: '1–2 months' },
  { value: '2_3_months', label: '2–3 months' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'not_decided', label: 'Not decided' },
] as const

export const intakeServiceOptions = [
  ...serviceHighlights.map((s) => ({ value: s.slug, label: s.title })),
  { value: 'other', label: 'Other' },
] as const

export function intakeLabelForService(value: string): string {
  const match = intakeServiceOptions.find((o) => o.value === value)
  return match?.label ?? value
}

export function budgetLabel(value: string): string {
  return budgetPreferenceOptions.find((o) => o.value === value)?.label ?? value
}

export function timelineLabel(value: string): string {
  return timelinePreferenceOptions.find((o) => o.value === value)?.label ?? value
}
