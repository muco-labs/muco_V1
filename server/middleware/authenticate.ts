import type { Context, Next } from 'hono'
import { eq } from 'drizzle-orm'
import { AppError } from '../lib/errors.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { getDb } from '../db/client.js'
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import type { PermissionName } from '../lib/auth/permissions.js'
import {
  hasPermission,
  roleCanAccessPortal,
  type PortalKind,
} from '../lib/auth/permissions.js'

export type AuthContext = {
  authUserId: string
  userId: string
  email: string
  status: string
  roles: string[]
  permissions: Set<string>
}

export type SupabaseIdentity = {
  id: string
  email: string
  emailVerified: boolean
}

const activeStatuses = new Set(['active'])

export async function verifySupabaseToken(c: Context, next: Next) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Authentication is not configured.', 503)
  }

  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Sign in to continue.', 401)
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new AppError('UNAUTHORIZED', 'Your session is invalid or expired. Please sign in again.', 401)
  }

  c.set('supabaseIdentity', {
    id: data.user.id,
    email: data.user.email ?? '',
    emailVerified: Boolean(data.user.email_confirmed_at),
  })
  await next()
}

export async function loadAuthContext(authUserId: string, email: string): Promise<AuthContext> {
  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Authentication is temporarily unavailable.', 503)
  }

  const [row] = await db.select().from(users).where(eq(users.authUserId, authUserId)).limit(1)

  if (!row) {
    throw new AppError('FORBIDDEN', 'Account setup is incomplete. Please complete registration.', 403)
  }

  if (!activeStatuses.has(row.status)) {
    throw new AppError(
      'FORBIDDEN',
      'This account is not active. Contact support if you need assistance.',
      403,
    )
  }

  const roleRows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, row.id))

  const roleNames = roleRows.map((r) => r.name)

  const permissionRows = await db
    .select({ name: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, row.id))

  const permissionSet = new Set(permissionRows.map((p) => p.name))

  return {
    authUserId,
    userId: row.id,
    email: row.email ?? email,
    status: row.status,
    roles: roleNames,
    permissions: permissionSet,
  }
}

export async function authenticate(c: Context, next: Next) {
  await verifySupabaseToken(c, async () => undefined)
  const identity = c.get('supabaseIdentity')
  const auth = await loadAuthContext(identity.id, identity.email)
  c.set('auth', auth)
  await next()
}

export function requirePermission(permission: PermissionName) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth')
    if (!hasPermission(auth.permissions, permission)) {
      throw new AppError('FORBIDDEN', 'You do not have permission to perform this action.', 403)
    }
    await next()
  }
}

export function requirePortal(portal: PortalKind) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth')
    if (!roleCanAccessPortal(auth.roles, portal)) {
      throw new AppError('FORBIDDEN', 'You do not have access to this area.', 403)
    }
    await next()
  }
}

export function requireAnyRole(...roleNames: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth')
    if (!roleNames.some((role) => auth.roles.includes(role))) {
      throw new AppError('FORBIDDEN', 'You do not have access to this area.', 403)
    }
    await next()
  }
}
