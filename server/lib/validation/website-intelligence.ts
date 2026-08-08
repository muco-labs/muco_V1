import { z } from 'zod'

export const createWebsiteAuditSchema = z.object({
  websiteUrl: z.string().trim().min(4).max(2048),
  companyName: z.string().trim().max(160).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export type CreateWebsiteAuditInput = z.infer<typeof createWebsiteAuditSchema>

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = []
    out[key].push(issue.message)
  }
  return out
}
