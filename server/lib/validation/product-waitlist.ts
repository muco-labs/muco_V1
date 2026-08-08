import { z } from 'zod'
import { isKnownProductSlug } from '../product/constants.js'

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = []
    out[key].push(issue.message)
  }
  return out
}

export const createProductWaitlistSchema = z.object({
  productSlug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .refine(isKnownProductSlug, { message: 'Unknown product.' }),
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(1).max(120).optional(),
  company: z.string().trim().max(160).optional(),
  useCase: z.string().trim().max(2000).optional(),
  marketingConsent: z.boolean(),
  sourcePath: z.string().trim().max(512).optional(),
  website: z.string().trim().max(200).optional(),
})

export type CreateProductWaitlistInput = z.infer<typeof createProductWaitlistSchema>
