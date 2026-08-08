/** Pricing structure labels — amounts come from proposals/invoices, not hardcoded deals. */
export const pricingPackageIds = ['starter', 'business', 'custom'] as const

export type PricingPackageId = (typeof pricingPackageIds)[number]

export const pricingComponentTypes = [
  'base_service',
  'feature',
  'addon',
  'maintenance',
  'recurring',
  'tax',
  'discount',
] as const

export const paymentScheduleOptions = [
  '100_upfront',
  '50_50',
  'milestone',
  'custom',
] as const

export function pricingPackageLabel(id: PricingPackageId): string {
  if (id === 'starter') return 'Starter'
  if (id === 'business') return 'Business'
  return 'Custom quote'
}
