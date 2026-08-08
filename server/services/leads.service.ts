import { eq } from 'drizzle-orm'
import { AppError } from '../lib/errors.js'
import { getDb } from '../db/client.js'
import { auditLogs, leadInteractions, leads } from '../db/schema.js'
import type { CreateLeadInput } from '../lib/validation/leads.js'
import { normalizeLeadSource, storageSourceValue } from '../lib/crm/constants.js'
import {
  findDuplicateHints,
  findLatestOpenLeadByEmail,
  notifyAdminsOfNewLead,
  recordLeadActivity,
} from './crm.service.js'
import { sendTransactionalEmail } from '../lib/email/send.js'

export type CreateLeadResult = {
  id: string
  status: string
  possibleDuplicate?: boolean
  reInquiry?: boolean
}

function attributionFields(input: CreateLeadInput) {
  return {
    landingPath: input.landingPath,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    utmContent: input.utmContent,
    referrerHost: input.referrerHost,
    pageSource: input.pageSource,
    businessCity: input.businessCity,
    businessState: input.businessState,
  }
}

function summarizeReInquiry(message: string): string {
  const trimmed = message.trim()
  if (trimmed.length <= 500) return trimmed
  return `${trimmed.slice(0, 497)}…`
}

async function recordWebsiteReInquiry(
  leadId: string,
  input: CreateLeadInput,
  source: string,
): Promise<void> {
  const db = getDb()
  if (!db) return

  const summary = summarizeReInquiry(input.message)

  await db.insert(leadInteractions).values({
    leadId,
    interactionType: 'message',
    summary: `Website re-inquiry: ${summary}`,
    nextAction: 'Review updated enquiry and follow up.',
  })

  const patch: Partial<typeof leads.$inferInsert> = {
    updatedAt: new Date(),
    ...attributionFields(input),
  }
  if (input.serviceInterest?.trim()) patch.serviceInterest = input.serviceInterest.trim()
  if (input.budget?.trim()) patch.budget = input.budget.trim()
  if (input.timeline?.trim()) patch.timeline = input.timeline.trim()
  if (input.phone?.trim()) patch.phone = input.phone.trim()
  if (input.company?.trim()) patch.company = input.company.trim()

  await db.update(leads).set(patch).where(eq(leads.id, leadId))

  await recordLeadActivity(leadId, 'lead.re_inquiry', null, {
    source,
    pageSource: input.pageSource,
    landingPath: input.landingPath,
  })
}

export async function createLeadFromWebsite(input: CreateLeadInput): Promise<CreateLeadResult> {
  const db = getDb()
  if (!db) {
    throw new AppError(
      'SERVICE_UNAVAILABLE',
      'Lead intake is temporarily unavailable. Please email us directly.',
      503,
    )
  }

  const source = storageSourceValue(normalizeLeadSource(input.source))
  const openLead = await findLatestOpenLeadByEmail(input.email)

  if (openLead) {
    await recordWebsiteReInquiry(openLead.id, input, source)
    await notifyAdminsOfNewLead(openLead.id, input.name)
    await sendTransactionalEmail('inquiry_confirmation', input.email, { name: input.name })

    await db.insert(auditLogs).values({
      action: 'lead.re_inquiry',
      entity: 'leads',
      entityId: openLead.id,
      metadata: JSON.stringify({ source, pageSource: input.pageSource }),
    })

    return {
      id: openLead.id,
      status: openLead.status,
      reInquiry: true,
    }
  }

  const hints = await findDuplicateHints({
    email: input.email,
    phone: input.phone,
    company: input.company,
  })

  const [lead] = await db
    .insert(leads)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      company: input.company,
      website: input.website,
      projectDescription: input.message,
      serviceInterest: input.serviceInterest,
      budget: input.budget,
      timeline: input.timeline,
      source,
      status: 'new',
      possibleDuplicateOf: hints.leadMatchId,
      ...attributionFields(input),
    })
    .returning({ id: leads.id, status: leads.status })

  await db.insert(auditLogs).values({
    action: 'lead.created',
    entity: 'leads',
    entityId: lead.id,
    metadata: JSON.stringify({ source, possibleDuplicate: Boolean(hints.leadMatchId || hints.customerMatchId) }),
  })

  await recordLeadActivity(lead.id, 'lead.created', null, {
    source,
    pageSource: input.pageSource,
    landingPath: input.landingPath,
  })
  await notifyAdminsOfNewLead(lead.id, input.name)

  await sendTransactionalEmail('inquiry_confirmation', input.email, { name: input.name })

  return {
    id: lead.id,
    status: 'new',
    possibleDuplicate: Boolean(hints.leadMatchId || hints.customerMatchId),
  }
}
