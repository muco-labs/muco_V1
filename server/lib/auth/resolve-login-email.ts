import { eq } from 'drizzle-orm'
import { getDb } from '../../db/client.js'
import { users } from '../../db/schema.js'
import { AppError } from '../errors.js'
import { isLikelyMucoLoginId, normalizeMucoLoginId } from './muco-login-id.js'

const INVALID_CREDENTIALS = 'Sign in failed. Check your MUCO ID or password.'

/**
 * Resolve email for Supabase password auth. Uses generic errors to limit account enumeration.
 */
export async function resolveAuthEmailFromIdentifier(identifier: string): Promise<string> {
  const trimmed = identifier.trim()
  if (!trimmed) {
    throw new AppError('UNAUTHORIZED', INVALID_CREDENTIALS, 401)
  }

  if (trimmed.includes('@')) {
    return trimmed.toLowerCase()
  }

  if (!isLikelyMucoLoginId(trimmed)) {
    throw new AppError('UNAUTHORIZED', INVALID_CREDENTIALS, 401)
  }

  const mucoLoginId = normalizeMucoLoginId(trimmed)
  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Sign-in is temporarily unavailable.', 503)
  }

  const [row] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.mucoLoginId, mucoLoginId))
    .limit(1)

  if (!row?.email) {
    throw new AppError('UNAUTHORIZED', INVALID_CREDENTIALS, 401)
  }

  return row.email.trim().toLowerCase()
}
