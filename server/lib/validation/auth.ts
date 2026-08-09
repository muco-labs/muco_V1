import { z } from 'zod'
import { isMucoDepartmentSlug } from '../org/departments.js'

export const passwordLoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your MUCO ID or email.').max(254),
  password: z.string().min(1, 'Password is required.').max(256),
})

export const registerCustomerSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required.').max(120),
  companyName: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(32).optional(),
})

export const inviteEmployeeSchema = z.object({
  email: z.string().trim().email('Enter a valid email.').max(254),
  fullName: z.string().trim().min(1, 'Name is required.').max(120),
  department: z
    .string()
    .trim()
    .max(80)
    .optional()
    .refine((v) => !v || isMucoDepartmentSlug(v), { message: 'Unknown department.' }),
  jobTitle: z.string().trim().max(80).optional(),
})

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'disabled', 'inactive']),
})

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'body'
    details[key] ??= []
    details[key].push(issue.message)
  }
  return details
}
