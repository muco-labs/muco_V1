import { describe, expect, it } from 'vitest'
import {
  conversationContextLabel,
  conversationContextReference,
  countUnreadForViewer,
  customerSenderLabel,
  isRecentDuplicateMessage,
  serializeCustomerConversation,
  serializeCustomerConversationMessage,
  validateMessageBody,
} from '../lib/communication/customer-conversation.js'
import { defaultRolePermissions } from '../lib/auth/role-permissions.js'
import { hasPermission } from '../lib/auth/permissions.js'

const projectId = '11111111-1111-1111-1111-111111111111'
const leadId = '22222222-2222-2222-2222-222222222222'
const proposalId = '33333333-3333-3333-3333-333333333333'

describe('validateMessageBody', () => {
  it('rejects empty messages', () => {
    expect(validateMessageBody('   ').ok).toBe(false)
  })

  it('accepts trimmed messages', () => {
    const result = validateMessageBody('  Hello MUCO  ')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.body).toBe('Hello MUCO')
  })

  it('strips null bytes', () => {
    const result = validateMessageBody('hello\u0000world')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.body).toBe('helloworld')
  })

  it('rejects overly long messages', () => {
    expect(validateMessageBody('x'.repeat(8001)).ok).toBe(false)
  })
})

describe('conversation context', () => {
  it('formats project reference', () => {
    expect(conversationContextReference({ projectId })).toBe('PROJ-11111111')
    expect(conversationContextLabel({ projectId })).toContain('PROJ-')
  })

  it('formats request reference', () => {
    expect(conversationContextReference({ leadId })).toBe('REQ-22222222')
  })

  it('formats proposal reference', () => {
    expect(conversationContextReference({ proposalId })).toBe('PROP-33333333')
  })
})

describe('customer DTO security', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')

  it('omits internal ids from list item', () => {
    const dto = serializeCustomerConversation(
      {
        id: projectId,
        customerId: 'hidden',
        projectId,
        leadId: null,
        proposalId: null,
        subject: 'Project chat',
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
      { unreadCount: 1 },
    )
    expect(dto).not.toHaveProperty('customerId')
    expect(dto).not.toHaveProperty('projectId')
    expect(dto.contextReference).toBe('PROJ-11111111')
  })

  it('never exposes internal-only messages', () => {
    expect(() =>
      serializeCustomerConversationMessage({
        id: 'm1',
        conversationId: projectId,
        senderType: 'team',
        senderUserId: 'emp',
        body: 'secret',
        customerVisible: false,
        readAt: null,
        createdAt: now,
      }),
    ).toThrow()
  })

  it('labels customer-facing senders', () => {
    const dto = serializeCustomerConversationMessage({
      id: 'm1',
      conversationId: projectId,
      senderType: 'team',
      senderUserId: null,
      body: 'Hi',
      customerVisible: true,
      readAt: null,
      createdAt: now,
    })
    expect(dto.senderLabel).toBe('MUCO Labs')
    expect(dto).not.toHaveProperty('senderUserId')
  })
})

describe('unread state', () => {
  it('counts unread for customer and team', () => {
    const messages = [
      { senderType: 'team' as const, readAt: null, customerVisible: true },
      { senderType: 'customer' as const, readAt: null, customerVisible: true },
      { senderType: 'team' as const, readAt: new Date(), customerVisible: true },
    ]
    expect(countUnreadForViewer(messages, 'customer')).toBe(1)
    expect(countUnreadForViewer(messages, 'team')).toBe(1)
  })
})

describe('duplicate message prevention', () => {
  it('detects rapid duplicate submissions', () => {
    const now = Date.now()
    expect(
      isRecentDuplicateMessage(
        { body: 'Same', senderType: 'customer', createdAt: new Date(now - 1000) },
        'Same',
        'customer',
        now,
      ),
    ).toBe(true)
  })
})

describe('RBAC', () => {
  it('allows customers to view and send messages', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'messages.view')).toBe(true)
    expect(hasPermission(customer, 'messages.send')).toBe(true)
  })

  it('allows admins to view and send messages', () => {
    const admin = new Set(defaultRolePermissions.ADMIN)
    expect(hasPermission(admin, 'messages.view')).toBe(true)
    expect(hasPermission(admin, 'messages.send')).toBe(true)
  })
})

describe('sender labels', () => {
  it('uses You and MUCO Labs', () => {
    expect(customerSenderLabel('customer')).toBe('You')
    expect(customerSenderLabel('team')).toBe('MUCO Labs')
  })
})
