import { AppError } from '../lib/errors.js'
import { getDb } from '../db/client.js'
import { auditLogs, leads } from '../db/schema.js'
import type { CreateLeadInput } from '../lib/validation/leads.js'
import { normalizeLeadSource, storageSourceValue } from '../lib/crm/constants.js'
import {
  findDuplicateHints,
  notifyAdminsOfNewLead,
  recordLeadActivity,
} from './crm.service.js'
import { sendTransactionalEmail } from '../lib/email/send.js'

export type CreateLeadResult = {
  id: string
  status: 'new'
  possibleDuplicate?: boolean
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
    })
    .returning({ id: leads.id, status: leads.status })

  await db.insert(auditLogs).values({
    action: 'lead.created',
    entity: 'leads',
    entityId: lead.id,
    metadata: JSON.stringify({ source, possibleDuplicate: Boolean(hints.leadMatchId || hints.customerMatchId) }),
  })

  await recordLeadActivity(lead.id, 'lead.created', null, { source })
  await notifyAdminsOfNewLead(lead.id, input.name)

  await sendTransactionalEmail('inquiry_confirmation', input.email, { name: input.name })

  return {
    id: lead.id,
    status: 'new',
    possibleDuplicate: Boolean(hints.leadMatchId || hints.customerMatchId),
  }
}
