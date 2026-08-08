import { AppError } from '../lib/errors.js'
import { getDb } from '../db/client.js'
import { auditLogs, leads } from '../db/schema.js'
import type { CreateLeadInput } from '../lib/validation/leads.js'

export type CreateLeadResult = {
  id: string
  status: 'new'
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

  const [lead] = await db
    .insert(leads)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      company: input.company,
      projectDescription: input.message,
      serviceInterest: input.serviceInterest,
      budget: input.budget,
      timeline: input.timeline,
      source: input.source ?? 'website_contact',
      status: 'new',
    })
    .returning({ id: leads.id, status: leads.status })

  await db.insert(auditLogs).values({
    action: 'lead.created',
    entity: 'leads',
    entityId: lead.id,
    metadata: JSON.stringify({ source: input.source ?? 'website_contact' }),
  })

  return { id: lead.id, status: 'new' }
}
