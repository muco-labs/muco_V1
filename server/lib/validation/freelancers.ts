import { z } from 'zod'
import { FREELANCER_SERVICE_CATEGORY_IDS } from '../freelancers/service-categories.js'
import { parsePortfolioUrls } from '../freelancers/portfolio-url.js'

const categorySchema = z
  .array(z.string().min(1).max(80))
  .min(1, 'Select at least one service category.')
  .max(8)

export const freelancerApplySchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(40).optional(),
  country: z.string().min(2).max(80).optional(),
  city: z.string().min(1).max(80).optional(),
  professionalRole: z.string().min(2).max(120),
  experienceLevel: z.string().min(1).max(80).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().min(20).max(8000),
  skills: z.string().min(2).max(2000),
  serviceCategories: categorySchema,
  portfolioUrls: z.array(z.string().url().max(500)).max(5).optional(),
  openToProjects: z.boolean().optional(),
  preferredProjectType: z.string().max(200).optional(),
  availabilityNote: z.string().max(1000).optional(),
  website: z.string().max(0).optional(),
})

export type FreelancerApplyInput = z.infer<typeof freelancerApplySchema>

export const freelancerProfileUpdateSchema = z.object({
  headline: z.string().max(200).optional(),
  bio: z.string().min(20).max(8000).optional(),
  skills: z.string().min(2).max(2000).optional(),
  serviceCategories: categorySchema.optional(),
  portfolioUrls: z.array(z.string().url().max(500)).max(5).optional(),
  professionalRole: z.string().min(2).max(120).optional(),
  country: z.string().min(2).max(80).optional(),
  city: z.string().min(1).max(80).optional(),
  phone: z.string().min(6).max(40).optional(),
  preferredProjectType: z.string().max(200).optional(),
  availabilityNote: z.string().max(1000).optional(),
  openToProjects: z.boolean().optional(),
})

export const freelancerAvailabilitySchema = z.object({
  availabilityStatus: z.enum(['available', 'limited', 'unavailable']),
  availabilityNote: z.string().max(1000).optional(),
})

export const freelancerAdminPatchSchema = z.object({
  verificationStatus: z.enum(['pending', 'verified', 'failed']).optional(),
  approvalStatus: z.enum(['under_review', 'approved', 'rejected', 'suspended']).optional(),
  availabilityStatus: z.enum(['available', 'limited', 'unavailable']).optional(),
})

export const freelancerNoteSchema = z.object({
  content: z.string().min(1).max(8000),
})

export const freelancerDiscoverQuerySchema = z.object({
  service: z.string().max(80).optional(),
  skill: z.string().max(80).optional(),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  q: z.string().max(200).optional(),
  availability: z.enum(['available', 'limited']).optional(),
  pricingType: z
    .enum(['fixed', 'starting_from', 'hourly', 'per_project', 'custom_quote'])
    .optional(),
  page: z.coerce.number().int().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

const pricingTypeSchema = z.enum([
  'fixed',
  'starting_from',
  'hourly',
  'per_project',
  'custom_quote',
])

export const freelancerServiceCreateSchema = z.object({
  serviceSlug: z.string().min(1).max(80),
  subServiceSlug: z.string().min(1).max(80).nullable().optional(),
  description: z.string().max(2000).optional(),
  experienceLevel: z.string().max(80).optional(),
  pricingType: pricingTypeSchema,
  basePrice: z.union([z.string(), z.number()]).nullable().optional(),
  minimumPrice: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.string().max(8).optional(),
  isActive: z.boolean().optional(),
})

export const freelancerServiceUpdateSchema = z.object({
  description: z.string().max(2000).nullable().optional(),
  experienceLevel: z.string().max(80).nullable().optional(),
  pricingType: pricingTypeSchema.optional(),
  basePrice: z.union([z.string(), z.number()]).nullable().optional(),
  minimumPrice: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.string().max(8).optional(),
  isActive: z.boolean().optional(),
})

export const freelancerSkillCreateSchema = z.object({
  serviceSlug: z.string().min(1).max(80),
  skillSlug: z.string().min(1).max(80),
})

export const freelancerServiceAdminPatchSchema = freelancerServiceUpdateSchema

export function validateFreelancerServiceCategories(ids: string[]): boolean {
  const allowed = new Set<string>(FREELANCER_SERVICE_CATEGORY_IDS)
  return ids.every((id) => allowed.has(id))
}

export function normalizeFreelancerApply(input: FreelancerApplyInput) {
  const portfolioUrls = parsePortfolioUrls(input.portfolioUrls ?? [])
  if (!validateFreelancerServiceCategories(input.serviceCategories)) {
    throw new Error('INVALID_CATEGORIES')
  }
  return {
    ...input,
    email: input.email.trim().toLowerCase(),
    fullName: input.fullName.trim(),
    portfolioUrls,
  }
}
