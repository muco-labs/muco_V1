import { getDb } from '../../db/client.js'
import { auditLogs } from '../../db/schema.js'

export async function recordAutomationEvent(input: {
  actorUserId?: string | null
  action: string
  entity: string
  entityId?: string | null
  result: 'success' | 'failure'
  metadata?: Record<string, unknown>
}) {
  const db = getDb()
  if (!db) return

  await db.insert(auditLogs).values({
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: JSON.stringify({
      automation: true,
      result: input.result,
      ...input.metadata,
    }),
  })
}
