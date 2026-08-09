/** Customer-facing reference from internal project id (UUID). */
export function formatProjectReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `PROJ-${normalized}` : `PROJ-${id.slice(0, 12)}`
}
