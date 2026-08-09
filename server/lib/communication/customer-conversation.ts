import { formatProjectReference } from '../projects/project-reference.js'
import { formatProjectRequestReference } from '../intake/project-request-reference.js'
import { formatProposalReference } from '../proposals/proposal-reference.js'

export const CUSTOMER_MESSAGE_MIN_LENGTH = 1
export const CUSTOMER_MESSAGE_MAX_LENGTH = 8000
export const CUSTOMER_CONVERSATION_MESSAGE_PAGE_SIZE = 50
export const DUPLICATE_MESSAGE_WINDOW_MS = 30_000

export type ConversationContextInput = {
  projectId?: string | null
  leadId?: string | null
  proposalId?: string | null
}

export function normalizeMessageBody(raw: string): string {
  return raw.replace(/\0/g, '').trim()
}

export function validateMessageBody(raw: string): { ok: true; body: string } | { ok: false; reason: string } {
  const body = normalizeMessageBody(raw)
  if (body.length < CUSTOMER_MESSAGE_MIN_LENGTH) {
    return { ok: false, reason: 'Message cannot be empty.' }
  }
  if (body.length > CUSTOMER_MESSAGE_MAX_LENGTH) {
    return { ok: false, reason: `Message must be at most ${CUSTOMER_MESSAGE_MAX_LENGTH} characters.` }
  }
  return { ok: true, body }
}

export function conversationContextReference(input: {
  projectId?: string | null
  leadId?: string | null
  proposalId?: string | null
}): string | null {
  if (input.projectId) return formatProjectReference(input.projectId)
  if (input.leadId) return formatProjectRequestReference(input.leadId)
  if (input.proposalId) return formatProposalReference(input.proposalId)
  return null
}

export function conversationContextLabel(input: {
  projectId?: string | null
  leadId?: string | null
  proposalId?: string | null
}): string {
  const ref = conversationContextReference(input)
  if (!ref) return 'General enquiry'
  if (input.projectId) return `Project: ${ref}`
  if (input.leadId) return `Request: ${ref}`
  if (input.proposalId) return `Proposal: ${ref}`
  return 'General enquiry'
}

export function defaultConversationSubject(input: ConversationContextInput): string {
  const label = conversationContextLabel(input)
  return label === 'General enquiry' ? 'General enquiry' : `Message about ${label}`
}

export function customerSenderLabel(senderType: 'customer' | 'team'): string {
  return senderType === 'customer' ? 'You' : 'MUCO Labs'
}

export function isRecentDuplicateMessage(
  previous: { body: string; senderType: 'customer' | 'team'; createdAt: Date } | null,
  nextBody: string,
  senderType: 'customer' | 'team',
  now = Date.now(),
): boolean {
  if (!previous) return false
  if (previous.senderType !== senderType) return false
  if (previous.body !== nextBody) return false
  return now - previous.createdAt.getTime() < DUPLICATE_MESSAGE_WINDOW_MS
}

export function countUnreadForViewer(
  messages: Array<{ senderType: 'customer' | 'team'; readAt: Date | null; customerVisible: boolean }>,
  viewer: 'customer' | 'team',
): number {
  const fromOther = viewer === 'customer' ? 'team' : 'customer'
  return messages.filter(
    (m) => m.senderType === fromOther && m.customerVisible && m.readAt == null,
  ).length
}

export type CustomerConversationRow = {
  id: string
  customerId: string
  projectId: string | null
  leadId: string | null
  proposalId: string | null
  subject: string
  status: 'open' | 'closed'
  createdAt: Date
  updatedAt: Date
}

export type CustomerConversationMessageRow = {
  id: string
  conversationId: string
  senderType: 'customer' | 'team'
  senderUserId: string | null
  body: string
  customerVisible: boolean
  readAt: Date | null
  createdAt: Date
}

export function serializeCustomerConversation(
  row: CustomerConversationRow,
  extras?: {
    latestMessage?: { body: string; createdAt: Date; senderType: 'customer' | 'team' } | null
    unreadCount?: number
  },
) {
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    statusLabel: row.status === 'open' ? 'Open' : 'Closed',
    contextLabel: conversationContextLabel(row),
    contextReference: conversationContextReference(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    latestMessage: extras?.latestMessage
      ? {
          body: extras.latestMessage.body,
          createdAt: extras.latestMessage.createdAt.toISOString(),
          senderLabel: customerSenderLabel(extras.latestMessage.senderType),
        }
      : null,
    unreadCount: extras?.unreadCount ?? 0,
  }
}

export function serializeCustomerConversationMessage(row: CustomerConversationMessageRow) {
  if (!row.customerVisible) {
    throw new Error('Internal message must not be exposed to customer')
  }
  return {
    id: row.id,
    body: row.body,
    senderType: row.senderType,
    senderLabel: customerSenderLabel(row.senderType),
    createdAt: row.createdAt.toISOString(),
    read: row.readAt != null,
  }
}

export function serializeAdminConversation(
  row: CustomerConversationRow,
  extras: {
    customerName: string
    customerEmail: string
    latestMessage?: { body: string; createdAt: Date; senderType: 'customer' | 'team' } | null
    unreadCount?: number
  },
) {
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    contextLabel: conversationContextLabel(row),
    contextReference: conversationContextReference(row),
    projectId: row.projectId,
    leadId: row.leadId,
    proposalId: row.proposalId,
    customer: {
      id: row.customerId,
      name: extras.customerName,
      email: extras.customerEmail,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    latestMessage: extras.latestMessage
      ? {
          body: extras.latestMessage.body,
          createdAt: extras.latestMessage.createdAt.toISOString(),
          senderType: extras.latestMessage.senderType,
        }
      : null,
    unreadCount: extras.unreadCount ?? 0,
  }
}

export function serializeAdminConversationMessage(row: CustomerConversationMessageRow) {
  return {
    id: row.id,
    body: row.body,
    senderType: row.senderType,
    customerVisible: row.customerVisible,
    createdAt: row.createdAt.toISOString(),
    read: row.readAt != null,
  }
}
