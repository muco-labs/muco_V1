/** Customer-safe API error copy — no stack traces or internal codes. */
export function friendlyCustomerPortalError(message: string): string {
  if (/unauthorized|401/i.test(message)) return 'Please sign in again to continue.'
  if (/forbidden|403/i.test(message)) return 'You do not have access to this resource.'
  if (/not found|404/i.test(message)) return 'We could not find that item. It may have been removed.'
  if (/network|fetch failed/i.test(message)) return 'Connection problem. Check your network and try again.'
  if (/rate limit|429/i.test(message)) return 'Too many requests. Please wait a moment and try again.'
  return message.length > 0 && message.length < 200
    ? message
    : 'Something went wrong. Please try again.'
}

export type PortalStatusTone = 'default' | 'success' | 'warning' | 'danger' | 'muted'

export function paymentStatusTone(status: string): PortalStatusTone {
  const s = status.toLowerCase().replace(/\s+/g, '_')
  if (['paid', 'succeeded', 'completed', 'success'].includes(s)) return 'success'
  if (['failed', 'failure'].includes(s)) return 'danger'
  if (['cancelled', 'canceled', 'refunded', 'void'].includes(s)) return 'muted'
  if (['pending', 'processing', 'created', 'authorized', 'unpaid', 'partial', 'overdue'].includes(s))
    return 'warning'
  return 'default'
}
