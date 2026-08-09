/** Customer-facing reference from application id (UUID). */
export function formatCareerApplicationReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `APP-${normalized}` : `APP-${id.slice(0, 12)}`
}
