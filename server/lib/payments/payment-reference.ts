/** Customer-facing reference from internal payment id (UUID). */
export function formatPaymentReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `PAY-${normalized}` : `PAY-${id.slice(0, 12)}`
}
