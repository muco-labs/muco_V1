import { and, desc, eq, gte } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { auditLogs, customerProfiles, leads, users } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { normalizeLeadSource, storageSourceValue } from '../lib/crm/constants.js'
import { PROJECT_INTAKE_PAGE_SOURCE } from '../lib/intake/project-intake-constants.js'
import { intakeServiceTitle } from '../lib/intake/service-slugs.js'
import type { ProjectIntakeInput } from '../lib/validation/project-intake.js'
import { validatePublicHttpUrl } from '../lib/website-intelligence/url-security.js'
import type { CustomerContext } from './customer.service.js'
import { updateCustomerProfile } from './customer.service.js'
import { notifyAdminsOfNewLead, recordLeadActivity } from './crm.service.js'
import { sendTransactionalEmail } from '../lib/email/send.js'

const BUDGET_LABELS: Record<ProjectIntakeInput['budgetPreference'], string> = {
  not_decided: 'Not decided',
  under_25k: 'Under ₹25,000',
  '25k_50k': '₹25,000–₹50,000',
  '50k_100k': '₹50,000–₹1,00,000',
  '100k_plus': '₹1,00,000+',
  custom: 'Custom / Discuss',
}

const TIMELINE_LABELS: Record<ProjectIntakeInput['timelinePreference'], string> = {
  asap: 'ASAP',
  '1_2_weeks': '1–2 weeks',
  '2_4_weeks': '2–4 weeks',
  '1_2_months': '1–2 months',
  '2_3_months': '2–3 months',
  flexible: 'Flexible',
  not_decided: 'Not decided',
}

export type IntakePrefill = {
  fullName: string | null
  email: string
  phone: string | null
  companyName: string | null
  country: string | null
  state: string | null
  city: string | null
  website: string | null
}

function optionalPublicUrl(url?: string): string | null {
  if (!url?.trim()) return null
  const result = validatePublicHttpUrl(url.trim())
  if (!result.ok) {
    throw new AppError('VALIDATION_ERROR', 'Enter a valid http or https website URL.', 400)
  }
  return result.url.toString()
}

export function buildProjectDescription(input: ProjectIntakeInput): string {
  const sections: string[] = [input.requirement.trim()]
  if (input.objective?.trim()) sections.push(`\n\nObjective:\n${input.objective.trim()}`)
  if (input.targetAudience?.trim()) sections.push(`\n\nTarget audience:\n${input.targetAudience.trim()}`)
  if (input.importantFeatures?.trim()) {
    sections.push(`\n\nImportant features:\n${input.importantFeatures.trim()}`)
  }
  if (input.referenceUrls?.trim()) sections.push(`\n\nReference URLs:\n${input.referenceUrls.trim()}`)
  if (input.submissionNotes?.trim()) sections.push(`\n\nAdditional notes:\n${input.submissionNotes.trim()}`)
  return sections.join('')
}

export function buildIntakeMetadata(input: ProjectIntakeInput) {
  return {
    intakeVersion: 1,
    primaryServiceSlug: input.primaryService,
    additionalServiceSlugs: input.additionalServices.filter((s) => s !== input.primaryService),
    budgetPreference: input.budgetPreference,
    timelinePreference: input.timelinePreference,
    existingUrl: input.existingUrl ?? null,
  }
}

export async function getProjectIntakePrefill(ctx: CustomerContext): Promise<IntakePrefill> {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1)
  const [profile] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, ctx.customerId))
    .limit(1)

  const billing = profile?.billingAddress ?? ''
  let country: string | null = null
  let state: string | null = null
  let city: string | null = null
  if (billing.includes('|')) {
    const parts = billing.split('|').map((p) => p.trim())
    city = parts[0] || null
    state = parts[1] || null
    country = parts[2] || null
  }

  const [recentLead] = await db
    .select({ website: leads.website })
    .from(leads)
    .where(eq(leads.customerId, ctx.customerId))
    .orderBy(desc(leads.createdAt))
    .limit(1)

  return {
    fullName: user?.fullName ?? ctx.fullName,
    email: user?.email ?? ctx.email,
    phone: profile?.phone ?? null,
    companyName: profile?.companyName ?? null,
    country,
    state,
    city,
    website: recentLead?.website ?? null,
  }
}

export async function createCustomerProjectRequest(
  ctx: CustomerContext,
  input: ProjectIntakeInput,
): Promise<{ id: string; status: string }> {
  if (input.email.trim().toLowerCase() !== ctx.email.trim().toLowerCase()) {
    throw new AppError('VALIDATION_ERROR', 'Email must match your signed-in account.', 400)
  }

  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Project intake is temporarily unavailable.', 503)
  }

  const website = optionalPublicUrl(input.website)
  const existingUrl = optionalPublicUrl(input.existingUrl)
  const primaryUrl = existingUrl ?? website

  const duplicateWindow = new Date(Date.now() - 3 * 60 * 1000)
  const [recentDuplicate] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.customerId, ctx.customerId),
        eq(leads.pageSource, PROJECT_INTAKE_PAGE_SOURCE),
        eq(leads.status, 'new'),
        gte(leads.createdAt, duplicateWindow),
      ),
    )
    .limit(1)

  if (recentDuplicate) {
    throw new AppError(
      'VALIDATION_ERROR',
      'A project request was just submitted. Please wait a moment before submitting again.',
      409,
    )
  }

  await updateCustomerProfile(ctx, {
    fullName: input.fullName,
    companyName: input.companyName,
    phone: input.phone,
    billingAddress: [input.city, input.state, input.country].filter(Boolean).join(' | ') || undefined,
  })

  const serviceInterest = intakeServiceTitle(input.primaryService, input.customPrimaryService)
  const additionalTitles = input.additionalServices
    .filter((s) => s !== input.primaryService)
    .map((s) => intakeServiceTitle(s))

  const budget =
    input.budgetPreference === 'custom' && input.budgetNotes?.trim()
      ? `Custom: ${input.budgetNotes.trim()}`
      : BUDGET_LABELS[input.budgetPreference]

  const timeline =
    input.timelineNotes?.trim() && input.timelinePreference !== 'not_decided'
      ? `${TIMELINE_LABELS[input.timelinePreference]} — ${input.timelineNotes.trim()}`
      : TIMELINE_LABELS[input.timelinePreference]

  const source = storageSourceValue(normalizeLeadSource('start_project'))

  const [lead] = await db
    .insert(leads)
    .values({
      name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      company: input.companyName?.trim() || null,
      website: primaryUrl,
      projectDescription: buildProjectDescription(input),
      serviceInterest,
      budget,
      timeline,
      source,
      status: 'new',
      customerId: ctx.customerId,
      pageSource: PROJECT_INTAKE_PAGE_SOURCE,
      businessCity: input.city?.trim() || null,
      businessState: input.state?.trim() || null,
      businessCountry: input.country?.trim() || null,
      notes: JSON.stringify({
        intake: buildIntakeMetadata(input),
        additionalServices: additionalTitles,
      }),
      qualificationUrgency: input.timelinePreference,
      qualificationProjectSize: input.budgetPreference,
    })
    .returning({ id: leads.id, status: leads.status })

  await db.insert(auditLogs).values({
    actorUserId: ctx.userId,
    action: 'lead.project_intake',
    entity: 'leads',
    entityId: lead.id,
    metadata: JSON.stringify({ source, pageSource: PROJECT_INTAKE_PAGE_SOURCE }),
  })

  await recordLeadActivity(lead.id, 'lead.created', ctx.userId, {
    source,
    pageSource: PROJECT_INTAKE_PAGE_SOURCE,
    intake: true,
  })

  await notifyAdminsOfNewLead(lead.id, input.fullName)
  await sendTransactionalEmail('inquiry_confirmation', input.email, { name: input.fullName })

  return { id: lead.id, status: lead.status }
}

export async function listCustomerProjectRequests(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const rows = await db
    .select({
      id: leads.id,
      status: leads.status,
      serviceInterest: leads.serviceInterest,
      budget: leads.budget,
      timeline: leads.timeline,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      projectDescription: leads.projectDescription,
    })
    .from(leads)
    .where(
      and(eq(leads.customerId, ctx.customerId), eq(leads.pageSource, PROJECT_INTAKE_PAGE_SOURCE)),
    )
    .orderBy(desc(leads.createdAt))
    .limit(50)

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    serviceInterest: row.serviceInterest,
    budget: row.budget,
    timeline: row.timeline,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    summary: row.projectDescription.slice(0, 160),
  }))
}

export async function getCustomerProjectRequest(ctx: CustomerContext, requestId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.id, requestId),
        eq(leads.customerId, ctx.customerId),
        eq(leads.pageSource, PROJECT_INTAKE_PAGE_SOURCE),
      ),
    )
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Project request not found.', 404)

  return {
    id: row.id,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    website: row.website,
    serviceInterest: row.serviceInterest,
    budget: row.budget,
    timeline: row.timeline,
    projectDescription: row.projectDescription,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
