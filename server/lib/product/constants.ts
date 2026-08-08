/** Primary SaaS opportunity under validation (Phase 10). */
export const PRIMARY_PRODUCT_SLUG = 'client-hub' as const

export const PRODUCT_SLUGS = [PRIMARY_PRODUCT_SLUG] as const

export type ProductSlug = (typeof PRODUCT_SLUGS)[number]

export function isKnownProductSlug(slug: string): slug is ProductSlug {
  return (PRODUCT_SLUGS as readonly string[]).includes(slug)
}
