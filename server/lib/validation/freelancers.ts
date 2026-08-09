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
  availabilityStatus: z.enum(['available', 'unavailable']),
  availabilityNote: z.string().max(1000).optional(),
})

export const freelancerAdminPatchSchema = z.object({
  verificationStatus: z.enum(['pending', 'verified', 'failed']).optional(),
  approvalStatus: z.enum(['under_review', 'approved', 'rejected', 'suspended']).optional(),
  availabilityStatus: z.enum(['available', 'unavailable']).optional(),
})

export const freelancerNoteSchema = z.object({
  content: z.string().min(1).max(8000),
})

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
