import { z } from 'zod'
import { isMucoDepartmentSlug } from '../org/departments.js'

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = []
    out[key].push(issue.message)
  }
  return out
}

export const employeeEmploymentStates = [
  'onboarding',
  'active',
  'on_leave',
  'offboarded',
] as const

export const updateEmployeeOrgSchema = z.object({
  department: z
    .string()
    .trim()
    .max(80)
    .optional()
    .refine((v) => !v || isMucoDepartmentSlug(v), { message: 'Unknown department.' }),
  jobTitle: z.string().trim().max(80).optional(),
  managerEmployeeId: z.string().uuid().nullable().optional(),
  employmentState: z.enum(employeeEmploymentStates).optional(),
})

export type UpdateEmployeeOrgInput = z.infer<typeof updateEmployeeOrgSchema>
