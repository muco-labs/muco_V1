/** Customer-facing reference from internal proposal id (UUID). */
export function formatProposalReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `PROP-${normalized}` : `PROP-${id.slice(0, 12)}`
}
