import { eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { customerProfiles, notifications } from '../db/schema.js'

export async function notifyCustomerProjectUpdate(
  customerId: string,
  input: { title: string; message: string; type: string },
) {
  const db = getDb()
  if (!db) return

  const [row] = await db
    .select({ userId: customerProfiles.userId })
    .from(customerProfiles)
    .where(eq(customerProfiles.id, customerId))
    .limit(1)

  if (!row?.userId) return

  await db.insert(notifications).values({
    userId: row.userId,
    type: input.type,
    title: input.title,
    message: input.message,
  })
}

export async function notifyProjectDeliveryEvent(
  customerId: string,
  input: { title: string; message: string; type: string },
) {
  return notifyCustomerProjectUpdate(customerId, input)
}
