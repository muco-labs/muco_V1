const FORBIDDEN_METADATA_KEYS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'service_role',
  'database_url',
  'private_key',
  'card_number',
  'cvv',
] as const

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Returns false if metadata object appears to contain credential-like fields. */
export function isSafeAuditMetadataValue(value: unknown, depth = 0): boolean {
  if (depth > 4) return true
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return true
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower.includes('postgresql://')) return false
    if (lower.includes('eyj') && value.length > 80) return false
    return true
  }
  if (Array.isArray(value)) {
    return value.every((item) => isSafeAuditMetadataValue(item, depth + 1))
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const nk = normalizeKey(key)
      if (FORBIDDEN_METADATA_KEYS.some((f) => nk.includes(f.replace(/_/g, '')))) {
        return false
      }
      if (!isSafeAuditMetadataValue(nested, depth + 1)) return false
    }
    return true
  }
  return true
}

export function assertSafeAuditMetadata(metadata: Record<string, unknown>): void {
  if (!isSafeAuditMetadataValue(metadata)) {
    throw new Error('Unsafe audit metadata rejected.')
  }
}
