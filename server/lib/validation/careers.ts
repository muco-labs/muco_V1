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

export const careerJobStatuses = ['draft', 'published', 'closed'] as const

export const careerEmploymentTypes = [
  'full_time',
  'part_time',
  'internship',
  'contract',
] as const

const careerJobSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens only.')

const careerJobBodyFields = {
  slug: careerJobSlugSchema,
  title: z.string().trim().min(2).max(200),
  department: z.string().trim().min(2).max(120),
  employmentType: z.enum(careerEmploymentTypes),
  experienceLevel: z.string().trim().max(80).optional().nullable(),
  locationLabel: z.string().trim().max(160).optional().nullable(),
  remoteStatus: z.string().trim().max(80).optional().nullable(),
  shortDescription: z.string().trim().min(20).max(2000),
  responsibilities: z.string().trim().min(20).max(12000),
  requiredSkills: z.string().trim().min(2).max(4000),
  preferredSkills: z.string().trim().max(4000).optional().nullable(),
  publishedAt: z.string().optional().nullable(),
  closesAt: z.string().optional().nullable(),
}

export const createCareerJobOpeningSchema = z.object(careerJobBodyFields)

export const updateCareerJobOpeningSchema = z.object({
  ...careerJobBodyFields,
  slug: careerJobSlugSchema.optional(),
  title: careerJobBodyFields.title.optional(),
  department: careerJobBodyFields.department.optional(),
  employmentType: careerJobBodyFields.employmentType.optional(),
  shortDescription: careerJobBodyFields.shortDescription.optional(),
  responsibilities: careerJobBodyFields.responsibilities.optional(),
  requiredSkills: careerJobBodyFields.requiredSkills.optional(),
})

export const updateCareerJobStatusSchema = z.object({
  status: z.enum(careerJobStatuses),
})

export type CreateCareerJobOpeningInput = z.infer<typeof createCareerJobOpeningSchema>
export type UpdateCareerJobOpeningInput = z.infer<typeof updateCareerJobOpeningSchema>

export type CreateCareerApplicationInput = z.infer<typeof createCareerApplicationSchema>
