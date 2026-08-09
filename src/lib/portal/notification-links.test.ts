import { describe, expect, it } from 'vitest'
import { notificationHref } from './notification-links'

describe('notificationHref', () => {
  it('maps customer conversation types', () => {
    expect(notificationHref('customer', 'conversation.team_reply')).toBe('/app/messages')
  })

  it('maps admin lead types', () => {
    expect(notificationHref('admin', 'crm.lead_assigned')).toBe('/admin/crm')
  })

  it('returns null for unknown types', () => {
    expect(notificationHref('admin', 'custom.unknown_event')).toBeNull()
  })
})
