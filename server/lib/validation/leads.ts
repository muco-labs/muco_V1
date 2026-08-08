import { z } from 'zod'

const controlCharFree = (value: string) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)

export const createLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(120)
    .refine(controlCharFree, 'Name contains invalid characters.'),
  email: z.string().trim().email('Enter a valid email.').max(254),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  company: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  website: z.string().trim().max(200).optional(),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required.')
    .max(4000)
    .refine(controlCharFree, 'Message contains invalid characters.'),
  serviceInterest: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(80).optional(),
  timeline: z.string().trim().max(120).optional(),
  source: z.string().trim().max(64).optional(),
  landingPath: z.string().trim().max(512).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmContent: z.string().trim().max(120).optional(),
  referrerHost: z.string().trim().max(120).optional(),
  pageSource: z.string().trim().max(64).optional(),
  businessCity: z.string().trim().max(80).optional(),
  businessState: z.string().trim().max(80).optional(),
  businessCountry: z.string().trim().max(80).optional(),
  contactTimezone: z.string().trim().max(64).optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'body'
    details[key] ??= []
    details[key].push(issue.message)
  }
  return details
}
