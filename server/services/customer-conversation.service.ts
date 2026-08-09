import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  sql,
} from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerConversationMessages,
  customerConversations,
  customerProfiles,
  leads,
  notifications,
  proposals,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import {
  countUnreadForViewer,
  CUSTOMER_CONVERSATION_MESSAGE_PAGE_SIZE,
  defaultConversationSubject,
  isRecentDuplicateMessage,
  serializeAdminConversation,
  serializeAdminConversationMessage,
  serializeCustomerConversation,
  serializeCustomerConversationMessage,
  validateMessageBody,
  type ConversationContextInput,
} from '../lib/communication/customer-conversation.js'
import { PROJECT_INTAKE_PAGE_SOURCE } from '../lib/intake/project-intake-constants.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { getOwnedProject, type CustomerContext } from './customer.service.js'

async function assertOwnedLead(customerId: string, leadId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.id, leadId),
        eq(leads.customerId, customerId),
        eq(leads.pageSource, PROJECT_INTAKE_PAGE_SOURCE),
      ),
    )
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Project request not found.', 404)
}

async function assertOwnedProposal(customerId: string, proposalId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.customerId, customerId)))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Proposal not found.', 404)
}

function assertSingleContext(input: ConversationContextInput) {
  const keys = [input.projectId, input.leadId, input.proposalId].filter(Boolean)
  if (keys.length > 1) {
    throw new AppError('VALIDATION_ERROR', 'Provide only one conversation context.', 400)
  }
}

async function findOpenConversationForContext(
  customerId: string,
  input: ConversationContextInput,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const conditions = [
    eq(customerConversations.customerId, customerId),
    eq(customerConversations.status, 'open'),
  ]

  if (input.projectId) {
    conditions.push(eq(customerConversations.projectId, input.projectId))
  } else if (input.leadId) {
    conditions.push(eq(customerConversations.leadId, input.leadId))
  } else if (input.proposalId) {
    conditions.push(eq(customerConversations.proposalId, input.proposalId))
  } else {
    return null
  }

  const [row] = await db
    .select()
    .from(customerConversations)
    .where(and(...conditions))
    .limit(1)

  return row ?? null
}

async function getOwnedConversation(customerId: string, conversationId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select()
    .from(customerConversations)
    .where(
      and(
        eq(customerConversations.id, conversationId),
        eq(customerConversations.customerId, customerId),
      ),
    )
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Conversation not found.', 404)
  return row
}

async function latestVisibleMessage(conversationId: string) {
  const db = getDb()
  if (!db) return null

  const [row] = await db
    .select()
    .from(customerConversationMessages)
    .where(
      and(
        eq(customerConversationMessages.conversationId, conversationId),
        eq(customerConversationMessages.customerVisible, true),
      ),
    )
    .orderBy(desc(customerConversationMessages.createdAt))
    .limit(1)

  return row ?? null
}

async function unreadCountForCustomer(conversationId: string) {
  const db = getDb()
  if (!db) return 0

  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(customerConversationMessages)
    .where(
      and(
        eq(customerConversationMessages.conversationId, conversationId),
        eq(customerConversationMessages.senderType, 'team'),
        eq(customerConversationMessages.customerVisible, true),
        isNull(customerConversationMessages.readAt),
      ),
    )

  return row?.c ?? 0
}

async function unreadCountForTeam(conversationId: string) {
  const db = getDb()
  if (!db) return 0

  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(customerConversationMessages)
    .where(
      and(
        eq(customerConversationMessages.conversationId, conversationId),
        eq(customerConversationMessages.senderType, 'customer'),
        isNull(customerConversationMessages.readAt),
      ),
    )

  return row?.c ?? 0
}

async function logConversationAudit(
  actorUserId: string | null,
  action: string,
  conversationId: string,
  metadata?: Record<string, string>,
) {
  const db = getDb()
  if (!db) return

  await db.insert(auditLogs).values({
    actorUserId,
    action,
    entity: 'customer_conversations',
    entityId: conversationId,
    metadata: metadata ? JSON.stringify(metadata) : null,
  })
}

async function notifyAdminsOfCustomerMessage(contextLabel: string) {
  const db = getDb()
  if (!db) return

  const adminUsers = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(inArray(roles.name, ['FOUNDER', 'ADMIN', 'SUPER_ADMIN']))

  const unique = [...new Set(adminUsers.map((r) => r.userId))]
  if (unique.length === 0) return

  await db.insert(notifications).values(
    unique.map((userId) => ({
      userId,
      type: 'conversation.customer_message',
      title: 'New customer message',
      message: `A customer sent a message (${contextLabel}). Open Messages in the admin portal.`,
    })),
  )
}

async function notifyCustomerOfTeamReply(customerId: string) {
  const db = getDb()
  if (!db) return

  const [profile] = await db
    .select({ userId: customerProfiles.userId })
    .from(customerProfiles)
    .where(eq(customerProfiles.id, customerId))
    .limit(1)

  if (!profile?.userId) return

  const since = new Date(Date.now() - 15 * 60 * 1000)
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, profile.userId),
        eq(notifications.type, 'conversation.team_reply'),
        eq(notifications.read, false),
        gt(notifications.createdAt, since),
      ),
    )
    .limit(1)

  if (existing) return

  await db.insert(notifications).values({
    userId: profile.userId,
    type: 'conversation.team_reply',
    title: 'MUCO Labs replied',
    message: 'MUCO Labs replied to your message. Open Messages in your portal to read the reply.',
  })
}

export async function listCustomerConversations(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const rows = await db
    .select()
    .from(customerConversations)
    .where(eq(customerConversations.customerId, ctx.customerId))
    .orderBy(desc(customerConversations.updatedAt))
    .limit(100)

  const items = await Promise.all(
    rows.map(async (row) => {
      const latest = await latestVisibleMessage(row.id)
      const unreadCount = await unreadCountForCustomer(row.id)
      return serializeCustomerConversation(row, {
        latestMessage: latest
          ? { body: latest.body, createdAt: latest.createdAt, senderType: latest.senderType }
          : null,
        unreadCount,
      })
    }),
  )

  return items
}

export async function getCustomerConversationSummary(ctx: CustomerContext) {
  const items = await listCustomerConversations(ctx)
  const unreadCount = items.reduce((sum, row) => sum + (row.unreadCount ?? 0), 0)
  const latest = items[0] ?? null
  return { unreadCount, latestConversation: latest }
}

export async function getCustomerConversation(ctx: CustomerContext, conversationId: string) {
  const row = await getOwnedConversation(ctx.customerId, conversationId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const before = undefined
  const messageRows = await loadConversationMessages(conversationId, {
    customerVisibleOnly: true,
    beforeMessageId: before,
  })

  return {
    conversation: serializeCustomerConversation(row, {
      unreadCount: await unreadCountForCustomer(conversationId),
    }),
    messages: messageRows.map((m) => serializeCustomerConversationMessage(m)),
  }
}

async function loadConversationMessages(
  conversationId: string,
  options: {
    customerVisibleOnly: boolean
    beforeMessageId?: string
    limit?: number
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const limit = options.limit ?? CUSTOMER_CONVERSATION_MESSAGE_PAGE_SIZE
  const conditions = [eq(customerConversationMessages.conversationId, conversationId)]

  if (options.customerVisibleOnly) {
    conditions.push(eq(customerConversationMessages.customerVisible, true))
  }

  if (options.beforeMessageId) {
    const [cursor] = await db
      .select({ createdAt: customerConversationMessages.createdAt })
      .from(customerConversationMessages)
      .where(eq(customerConversationMessages.id, options.beforeMessageId))
      .limit(1)

    if (cursor) {
      conditions.push(lt(customerConversationMessages.createdAt, cursor.createdAt))
    }
  }

  const rows = await db
    .select()
    .from(customerConversationMessages)
    .where(and(...conditions))
    .orderBy(desc(customerConversationMessages.createdAt))
    .limit(limit)

  return rows.reverse()
}

export async function createCustomerConversation(
  ctx: CustomerContext,
  input: ConversationContextInput & { subject?: string; body?: string },
) {
  assertSingleContext(input)

  if (input.projectId) await getOwnedProject(ctx.customerId, input.projectId)
  if (input.leadId) await assertOwnedLead(ctx.customerId, input.leadId)
  if (input.proposalId) await assertOwnedProposal(ctx.customerId, input.proposalId)

  const existing = await findOpenConversationForContext(ctx.customerId, input)
  if (existing) {
    if (input.body) {
      await sendCustomerConversationMessage(ctx, existing.id, input.body)
    }
    return serializeCustomerConversation(existing, {
      unreadCount: await unreadCountForCustomer(existing.id),
    })
  }

  const subject = (input.subject?.trim() || defaultConversationSubject(input)).slice(0, 200)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .insert(customerConversations)
    .values({
      customerId: ctx.customerId,
      projectId: input.projectId ?? null,
      leadId: input.leadId ?? null,
      proposalId: input.proposalId ?? null,
      subject,
    })
    .returning()

  await logConversationAudit(ctx.userId, 'conversation.created', row.id, {
    context: input.projectId ? 'project' : input.leadId ? 'request' : input.proposalId ? 'proposal' : 'general',
  })

  if (input.body) {
    await sendCustomerConversationMessage(ctx, row.id, input.body)
  }

  return serializeCustomerConversation(row, { unreadCount: 0 })
}

export async function sendCustomerConversationMessage(
  ctx: CustomerContext,
  conversationId: string,
  rawBody: string,
) {
  const validated = validateMessageBody(rawBody)
  if (!validated.ok) {
    throw new AppError('VALIDATION_ERROR', validated.reason, 400)
  }

  const conversation = await getOwnedConversation(ctx.customerId, conversationId)
  if (conversation.status === 'closed') {
    throw new AppError('CONFLICT', 'This conversation is closed.', 409)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const previous = await latestVisibleMessage(conversationId)
  if (
    isRecentDuplicateMessage(
      previous
        ? {
            body: previous.body,
            senderType: previous.senderType,
            createdAt: previous.createdAt,
          }
        : null,
      validated.body,
      'customer',
    )
  ) {
    if (previous) {
      return serializeCustomerConversationMessage(previous)
    }
  }

  const [message] = await db
    .insert(customerConversationMessages)
    .values({
      conversationId,
      senderType: 'customer',
      senderUserId: ctx.userId,
      body: validated.body,
      customerVisible: true,
    })
    .returning()

  await db
    .update(customerConversations)
    .set({ updatedAt: new Date() })
    .where(eq(customerConversations.id, conversationId))

  await logConversationAudit(ctx.userId, 'message.sent', conversationId, { sender: 'customer' })
  await notifyAdminsOfCustomerMessage(defaultConversationSubject(conversation))

  return serializeCustomerConversationMessage(message)
}

export async function markCustomerConversationRead(ctx: CustomerContext, conversationId: string) {
  await getOwnedConversation(ctx.customerId, conversationId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  await db
    .update(customerConversationMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(customerConversationMessages.conversationId, conversationId),
        eq(customerConversationMessages.senderType, 'team'),
        eq(customerConversationMessages.customerVisible, true),
        isNull(customerConversationMessages.readAt),
      ),
    )

  return { ok: true as const }
}

export async function closeCustomerConversation(ctx: CustomerContext, conversationId: string) {
  const row = await getOwnedConversation(ctx.customerId, conversationId)
  if (row.status === 'closed') return serializeCustomerConversation(row, { unreadCount: 0 })

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [updated] = await db
    .update(customerConversations)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(eq(customerConversations.id, conversationId))
    .returning()

  await logConversationAudit(ctx.userId, 'conversation.closed', conversationId)
  return serializeCustomerConversation(updated, { unreadCount: 0 })
}

function assertAdminCanAccessMessages(auth: AuthContext) {
  if (!hasPermission(auth.permissions, 'messages.view')) {
    throw new AppError('FORBIDDEN', 'You cannot view customer conversations.', 403)
  }
}

function assertAdminCanReply(auth: AuthContext) {
  if (!hasPermission(auth.permissions, 'messages.send')) {
    throw new AppError('FORBIDDEN', 'You cannot reply to customer conversations.', 403)
  }
}

export async function listAdminConversations(
  auth: AuthContext,
  filters?: { status?: 'open' | 'closed'; unreadOnly?: boolean },
) {
  assertAdminCanAccessMessages(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const conditions = []
  if (filters?.status) {
    conditions.push(eq(customerConversations.status, filters.status))
  }

  const rows = await db
    .select()
    .from(customerConversations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(customerConversations.updatedAt))
    .limit(100)

  const items = await Promise.all(
    rows.map(async (row) => {
      const unreadCount = await unreadCountForTeam(row.id)
      if (filters?.unreadOnly && unreadCount === 0) return null

      const [customer] = await db
        .select({
          companyName: customerProfiles.companyName,
          userId: customerProfiles.userId,
        })
        .from(customerProfiles)
        .where(eq(customerProfiles.id, row.customerId))
        .limit(1)

      const [user] = customer?.userId
        ? await db.select().from(users).where(eq(users.id, customer.userId)).limit(1)
        : [null]

      const latest = await latestVisibleMessage(row.id)

      return serializeAdminConversation(row, {
        customerName: user?.fullName ?? user?.email ?? 'Customer',
        customerEmail: user?.email ?? '',
        latestMessage: latest
          ? { body: latest.body, createdAt: latest.createdAt, senderType: latest.senderType }
          : null,
        unreadCount,
      })
    }),
  )

  return items.filter((row): row is NonNullable<typeof row> => row != null)
}

export async function getAdminConversation(auth: AuthContext, conversationId: string) {
  assertAdminCanAccessMessages(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select()
    .from(customerConversations)
    .where(eq(customerConversations.id, conversationId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Conversation not found.', 404)

  const [customer] = await db
    .select({ userId: customerProfiles.userId })
    .from(customerProfiles)
    .where(eq(customerProfiles.id, row.customerId))
    .limit(1)

  const [user] = customer?.userId
    ? await db.select().from(users).where(eq(users.id, customer.userId)).limit(1)
    : [null]

  const messages = await loadConversationMessages(conversationId, { customerVisibleOnly: false })

  return {
    conversation: serializeAdminConversation(row, {
      customerName: user?.fullName ?? user?.email ?? 'Customer',
      customerEmail: user?.email ?? '',
      unreadCount: await unreadCountForTeam(conversationId),
    }),
    messages: messages.map((m) => serializeAdminConversationMessage(m)),
  }
}

export async function sendAdminConversationMessage(
  auth: AuthContext,
  conversationId: string,
  rawBody: string,
) {
  assertAdminCanReply(auth)
  const validated = validateMessageBody(rawBody)
  if (!validated.ok) {
    throw new AppError('VALIDATION_ERROR', validated.reason, 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [conversation] = await db
    .select()
    .from(customerConversations)
    .where(eq(customerConversations.id, conversationId))
    .limit(1)

  if (!conversation) throw new AppError('NOT_FOUND', 'Conversation not found.', 404)
  if (conversation.status === 'closed') {
    throw new AppError('CONFLICT', 'This conversation is closed.', 409)
  }

  const previous = await latestVisibleMessage(conversationId)
  if (
    isRecentDuplicateMessage(
      previous
        ? {
            body: previous.body,
            senderType: previous.senderType,
            createdAt: previous.createdAt,
          }
        : null,
      validated.body,
      'team',
    )
  ) {
    if (previous) {
      return serializeAdminConversationMessage(previous)
    }
  }

  const [message] = await db
    .insert(customerConversationMessages)
    .values({
      conversationId,
      senderType: 'team',
      senderUserId: auth.userId,
      body: validated.body,
      customerVisible: true,
    })
    .returning()

  await db
    .update(customerConversations)
    .set({ updatedAt: new Date(), status: 'open' })
    .where(eq(customerConversations.id, conversationId))

  await logConversationAudit(auth.userId, 'message.sent', conversationId, { sender: 'team' })
  await notifyCustomerOfTeamReply(conversation.customerId)

  return serializeAdminConversationMessage(message)
}

export async function markAdminConversationRead(auth: AuthContext, conversationId: string) {
  assertAdminCanAccessMessages(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select({ id: customerConversations.id })
    .from(customerConversations)
    .where(eq(customerConversations.id, conversationId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Conversation not found.', 404)

  await db
    .update(customerConversationMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(customerConversationMessages.conversationId, conversationId),
        eq(customerConversationMessages.senderType, 'customer'),
        isNull(customerConversationMessages.readAt),
      ),
    )

  return { ok: true as const }
}

export async function setAdminConversationStatus(
  auth: AuthContext,
  conversationId: string,
  status: 'open' | 'closed',
) {
  assertAdminCanReply(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [updated] = await db
    .update(customerConversations)
    .set({ status, updatedAt: new Date() })
    .where(eq(customerConversations.id, conversationId))
    .returning()

  if (!updated) throw new AppError('NOT_FOUND', 'Conversation not found.', 404)

  await logConversationAudit(
    auth.userId,
    status === 'closed' ? 'conversation.closed' : 'conversation.reopened',
    conversationId,
  )

  return getAdminConversation(auth, conversationId)
}

export { countUnreadForViewer }
