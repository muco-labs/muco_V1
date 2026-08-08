import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { productWaitlist } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { CreateProductWaitlistInput } from '../lib/validation/product-waitlist.js'

export type ProductWaitlistEntry = {
  id: string
  productSlug: string
  email: string
  fullName: string | null
  company: string | null
  useCase: string | null
  marketingConsent: boolean
  sourcePath: string | null
  createdAt: string
}

function mapRow(row: typeof productWaitlist.$inferSelect): ProductWaitlistEntry {
  return {
    id: row.id,
    productSlug: row.productSlug,
    email: row.email,
    fullName: row.fullName,
    company: row.company,
    useCase: row.useCase,
    marketingConsent: row.marketingConsent,
    sourcePath: row.sourcePath,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function createProductWaitlistEntry(
  input: CreateProductWaitlistInput,
): Promise<{ id: string; alreadyRegistered: boolean }> {
  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Waitlist is temporarily unavailable.', 503)
  }

  const normalizedEmail = input.email.toLowerCase()

  const [existing] = await db
    .select({ id: productWaitlist.id })
    .from(productWaitlist)
    .where(
      and(
        eq(productWaitlist.email, normalizedEmail),
        eq(productWaitlist.productSlug, input.productSlug),
      ),
    )
    .limit(1)

  if (existing) {
    return { id: existing.id, alreadyRegistered: true }
  }

  try {
    const [inserted] = await db
      .insert(productWaitlist)
      .values({
        productSlug: input.productSlug,
        email: normalizedEmail,
        fullName: input.fullName?.trim() || null,
        company: input.company?.trim() || null,
        useCase: input.useCase?.trim() || null,
        marketingConsent: input.marketingConsent,
        sourcePath: input.sourcePath?.trim() || null,
      })
      .returning({ id: productWaitlist.id })

    return { id: inserted.id, alreadyRegistered: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('product_waitlist_product_email_idx')) {
      const [row] = await db
        .select({ id: productWaitlist.id })
        .from(productWaitlist)
        .where(
          and(
            eq(productWaitlist.email, normalizedEmail),
            eq(productWaitlist.productSlug, input.productSlug),
          ),
        )
        .limit(1)
      if (row) return { id: row.id, alreadyRegistered: true }
    }
    throw error
  }
}

export async function listProductWaitlistForAdmin(options?: {
  productSlug?: string
  limit?: number
}): Promise<ProductWaitlistEntry[]> {
  const db = getDb()
  if (!db) return []

  const limit = Math.min(Math.max(options?.limit ?? 200, 1), 500)

  const rows = options?.productSlug
    ? await db
        .select()
        .from(productWaitlist)
        .where(eq(productWaitlist.productSlug, options.productSlug))
        .orderBy(desc(productWaitlist.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(productWaitlist)
        .orderBy(desc(productWaitlist.createdAt))
        .limit(limit)

  return rows.map(mapRow)
}
