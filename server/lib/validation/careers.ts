import { z } from 'zod'

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .refine((v) => !v || /^https?:\/\//i.test(v), { message: 'Enter a valid http or https URL.' })

export const careerApplicationTypes = [
  'full_time',
  'part_time',
  'internship',
  'contract',
  'general',
] as const

export const careerApplicationStatuses = [
  'new',
  'reviewing',
  'shortlisted',
  'interview',
  'selected',
  'rejected',
  'archived',
] as const

export const createCareerApplicationSchema = z.object({
  jobOpeningId: z.string().uuid().optional(),
  jobOpeningSlug: z.string().trim().max(120).optional(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  roleInterest: z.string().trim().min(2).max(160),
  applicationType: z.enum(careerApplicationTypes),
  experienceLevel: z.string().trim().max(80).optional(),
  skills: z.string().trim().min(2).max(4000),
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  introduction: z.string().trim().min(20).max(8000),
  availability: z.string().trim().min(2).max(500),
  preferredEngagement: z.string().trim().max(200).optional(),
  additionalInfo: z.string().trim().max(4000).optional(),
  website: z.string().max(0).optional(),
})

export const careerResumeMetaSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120),
  fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
})

export const updateCareerApplicationStatusSchema = z.object({
  status: z.enum(careerApplicationStatuses),
})

export type CreateCareerApplicationInput = z.infer<typeof createCareerApplicationSchema>
