/** Canonical MUCO departments — reference list only; no auto-seeded rows. */
export const mucoDepartments = [
  { slug: 'management', label: 'Foundation / Management' },
  { slug: 'engineering', label: 'Engineering' },
  { slug: 'design', label: 'Design' },
  { slug: 'product', label: 'Product' },
  { slug: 'sales', label: 'Sales' },
  { slug: 'marketing', label: 'Marketing / SEO' },
  { slug: 'customer_success', label: 'Customer Success' },
  { slug: 'support', label: 'Support' },
  { slug: 'finance', label: 'Finance / Operations' },
  { slug: 'people', label: 'HR / People' },
] as const

export type MucoDepartmentSlug = (typeof mucoDepartments)[number]['slug']

const slugSet = new Set<string>(mucoDepartments.map((d) => d.slug))

export function isMucoDepartmentSlug(value: string): value is MucoDepartmentSlug {
  return slugSet.has(value)
}

export function normalizeDepartmentSlug(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  const slug = value.trim().toLowerCase().replace(/\s+/g, '_')
  return isMucoDepartmentSlug(slug) ? slug : null
}

export function departmentLabel(slug: string | null | undefined): string | null {
  if (!slug) return null
  return mucoDepartments.find((d) => d.slug === slug)?.label ?? slug
}
