import { z } from 'zod'
import { INTAKE_SERVICE_SLUGS } from '../intake/service-slugs.js'

const controlCharFree = (value: string) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)

const serviceSlugEnum = z.enum(INTAKE_SERVICE_SLUGS)

export const projectIntakeSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).refine(controlCharFree),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional(),
    companyName: z.string().trim().max(160).optional(),
    country: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    website: z.string().trim().max(200).optional(),
    primaryService: serviceSlugEnum,
    customPrimaryService: z.string().trim().max(120).optional(),
    additionalServices: z.array(serviceSlugEnum).max(8).default([]),
    requirement: z.string().trim().min(20).max(8000).refine(controlCharFree),
    objective: z.string().trim().max(2000).optional(),
    targetAudience: z.string().trim().max(2000).optional(),
    existingUrl: z.string().trim().max(200).optional(),
    importantFeatures: z.string().trim().max(3000).optional(),
    referenceUrls: z.string().trim().max(2000).optional(),
    budgetPreference: z.enum([
      'not_decided',
      'under_25k',
      '25k_50k',
      '50k_100k',
      '100k_plus',
      'custom',
    ]),
    budgetNotes: z.string().trim().max(500).optional(),
    timelinePreference: z.enum([
      'asap',
      '1_2_weeks',
      '2_4_weeks',
      '1_2_months',
      '2_3_months',
      'flexible',
      'not_decided',
    ]),
    timelineNotes: z.string().trim().max(500).optional(),
    submissionNotes: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.primaryService === 'other' && !data.customPrimaryService?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Describe the service you need when selecting Other.',
        path: ['customPrimaryService'],
      })
    }
  })

export type ProjectIntakeInput = z.infer<typeof projectIntakeSchema>

export function formatZodIntakeErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'body'
    details[key] ??= []
    details[key].push(issue.message)
  }
  return details
}
