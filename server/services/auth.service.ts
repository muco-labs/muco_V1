import { eq, and, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  employeeProfiles,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { defaultRolePermissions } from '../lib/auth/role-permissions.js'
import type { RoleName } from '../lib/auth/permissions.js'
import {
  formatMucoLoginId,
  mucoLoginIdSuffixFromUuid,
} from '../lib/auth/muco-login-id.js'

export type RegisterCustomerInput = {
  fullName: string
  companyName?: string
  phone?: string
}

async function assignMucoLoginIdIfMissing(userId: string, role: RoleName) {
  const db = getDb()
  if (!db) return

  const [row] = await db.select({ mucoLoginId: users.mucoLoginId }).from(users).where(eq(users.id, userId)).limit(1)
  if (!row || row.mucoLoginId) return

  const mucoLoginId = formatMucoLoginId(role, mucoLoginIdSuffixFromUuid(userId))
  await db
    .update(users)
    .set({ mucoLoginId, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

/** Backfill public login id for legacy rows (idempotent). */
export async function ensureMucoLoginIdForUser(userId: string) {
  const db = getDb()
  if (!db) return

  const [row] = await db
    .select({ mucoLoginId: users.mucoLoginId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!row || row.mucoLoginId) return

  const roleRows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))
    .limit(1)

  const role = (roleRows[0]?.name ?? 'CUSTOMER') as RoleName
  await assignMucoLoginIdIfMissing(userId, role)
}

export async function registerCustomerFromAuth(
  authUserId: string,
  email: string,
  input: RegisterCustomerInput,
) {
  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Registration is temporarily unavailable.', 503)
  }

  const normalizedEmail = email.trim().toLowerCase()

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1)

  if (existing.length > 0) {
    await assignMucoLoginIdIfMissing(existing[0].id, 'CUSTOMER')
    return { userId: existing[0].id, created: false as const }
  }

  const [user] = await db
    .insert(users)
    .values({
      authUserId,
      email: normalizedEmail,
      fullName: input.fullName.trim(),
      authProvider: 'supabase',
      status: 'pending',
    })
    .returning()

  const [customerRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, 'CUSTOMER'))
    .limit(1)

  if (!customerRole) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Roles are not configured.', 503)
  }

  await db.insert(userRoles).values({ userId: user.id, roleId: customerRole.id })

  await db.insert(customerProfiles).values({
    userId: user.id,
    companyName: input.companyName?.trim() || null,
    phone: input.phone?.trim() || null,
  })

  await db.insert(auditLogs).values({
    actorUserId: user.id,
    action: 'auth.customer_registered',
    entity: 'users',
    entityId: user.id,
    metadata: JSON.stringify({ email: normalizedEmail }),
  })

  await assignMucoLoginIdIfMissing(user.id, 'CUSTOMER')

  return { userId: user.id, created: true as const }
}

export async function activateAccountIfEligible(authUserId: string, emailVerified: boolean) {
  if (!emailVerified) return

  const db = getDb()
  if (!db) return

  await db
    .update(users)
    .set({ status: 'active', updatedAt: new Date() })
    .where(
      and(
        eq(users.authUserId, authUserId),
        inArray(users.status, ['pending', 'invited']),
      ),
    )
}

export async function assignRoleToUser(userId: string, roleName: RoleName) {
  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Database is not configured.', 503)
  }

  const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1)
  if (!role) {
    throw new AppError('SERVICE_UNAVAILABLE', `Role ${roleName} is not configured.`, 503)
  }

  await db
    .insert(userRoles)
    .values({ userId, roleId: role.id })
    .onConflictDoNothing()
}

export async function inviteEmployee(input: {
  email: string
  fullName: string
  department?: string
  jobTitle?: string
  invitedByUserId: string
}) {
  const supabase = getSupabaseAdmin()
  const db = getDb()
  if (!supabase || !db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Invitation is temporarily unavailable.', 503)
  }

  const email = input.email.trim().toLowerCase()
  const redirectTo = process.env.AUTH_INVITE_REDIRECT_URL?.trim() || process.env.AUTH_REDIRECT_URL

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectTo || undefined,
    data: {
      full_name: input.fullName.trim(),
      invited_as: 'employee',
    },
  })

  if (error) {
    throw new AppError('CONFLICT', 'Unable to send invitation. Try again or contact support.', 409)
  }

  const authUserId = data.user?.id
  if (!authUserId) {
    throw new AppError('INTERNAL_ERROR', 'Invitation could not be completed.', 500)
  }

  const [user] = await db
    .insert(users)
    .values({
      authUserId,
      email,
      fullName: input.fullName.trim(),
      authProvider: 'supabase',
      status: 'invited',
    })
    .onConflictDoUpdate({
      target: users.authUserId,
      set: {
        fullName: input.fullName.trim(),
        status: 'invited',
        updatedAt: new Date(),
      },
    })
    .returning()

  await assignRoleToUser(user.id, 'EMPLOYEE')

  await db
    .insert(employeeProfiles)
    .values({
      userId: user.id,
      department: input.department?.trim() || null,
      jobTitle: input.jobTitle?.trim() || null,
      employmentState: 'onboarding',
    })
    .onConflictDoUpdate({
      target: employeeProfiles.userId,
      set: {
        department: input.department?.trim() || null,
        jobTitle: input.jobTitle?.trim() || null,
        employmentState: 'onboarding',
        updatedAt: new Date(),
      },
    })

  await db.insert(auditLogs).values({
    actorUserId: input.invitedByUserId,
    action: 'employee.invited',
    entity: 'users',
    entityId: user.id,
    metadata: JSON.stringify({ email }),
  })

  await assignMucoLoginIdIfMissing(user.id, 'EMPLOYEE')

  return { userId: user.id, email }
}

export async function inviteCustomerFromLead(input: {
  email: string
  fullName: string
  companyName?: string
  phone?: string
  invitedByUserId: string
}) {
  const supabase = getSupabaseAdmin()
  const db = getDb()
  if (!supabase || !db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Invitation is temporarily unavailable.', 503)
  }

  const email = input.email.trim().toLowerCase()

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingUser[0]) {
    const [profile] = await db
      .select({ id: customerProfiles.id })
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, existingUser[0].id))
      .limit(1)
    if (profile) {
      return { userId: existingUser[0].id, customerProfileId: profile.id, invited: false as const }
    }
  }

  const redirectTo = process.env.AUTH_INVITE_REDIRECT_URL?.trim() || process.env.AUTH_REDIRECT_URL
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectTo || undefined,
    data: { full_name: input.fullName.trim(), invited_as: 'customer' },
  })

  if (error) {
    throw new AppError('CONFLICT', 'Unable to send customer invitation.', 409)
  }

  const authUserId = data.user?.id
  if (!authUserId) {
    throw new AppError('INTERNAL_ERROR', 'Invitation could not be completed.', 500)
  }

  const [user] = await db
    .insert(users)
    .values({
      authUserId,
      email,
      fullName: input.fullName.trim(),
      authProvider: 'supabase',
      status: 'invited',
    })
    .onConflictDoUpdate({
      target: users.authUserId,
      set: { fullName: input.fullName.trim(), status: 'invited', updatedAt: new Date() },
    })
    .returning()

  await assignRoleToUser(user.id, 'CUSTOMER')

  const [profile] = await db
    .insert(customerProfiles)
    .values({
      userId: user.id,
      companyName: input.companyName?.trim() || null,
      phone: input.phone?.trim() || null,
    })
    .onConflictDoUpdate({
      target: customerProfiles.userId,
      set: {
        companyName: input.companyName?.trim() || null,
        phone: input.phone?.trim() || null,
        updatedAt: new Date(),
      },
    })
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: input.invitedByUserId,
    action: 'customer.invited_from_lead',
    entity: 'customer_profiles',
    entityId: profile.id,
    metadata: JSON.stringify({ email }),
  })

  await assignMucoLoginIdIfMissing(user.id, 'CUSTOMER')

  return { userId: user.id, customerProfileId: profile.id, invited: true as const }
}

export async function setUserStatus(
  targetUserId: string,
  status: 'active' | 'suspended' | 'disabled' | 'inactive',
  actorUserId: string,
) {
  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Database is not configured.', 503)
  }

  const [updated] = await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, targetUserId))
    .returning({ id: users.id })

  if (!updated) {
    throw new AppError('NOT_FOUND', 'User not found.', 404)
  }

  await db.insert(auditLogs).values({
    actorUserId,
    action: 'user.status_changed',
    entity: 'users',
    entityId: targetUserId,
    metadata: JSON.stringify({ status }),
  })
}

/** Seed helper: ensure permissions exist for a role name. */
export async function ensureRolePermissionsSeeded(roleName: RoleName) {
  const db = getDb()
  if (!db) return

  const grants = defaultRolePermissions[roleName]
  const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1)
  if (!role) return

  for (const permName of grants) {
    const [perm] = await db
      .insert(permissions)
      .values({ name: permName, description: permName })
      .onConflictDoNothing({ target: permissions.name })
      .returning()

    const permissionId =
      perm?.id ??
      (
        await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1)
      )[0]?.id

    if (permissionId) {
      await db
        .insert(rolePermissions)
        .values({ roleId: role.id, permissionId })
        .onConflictDoNothing()
    }
  }
}

export async function bootstrapFounderAccount(email: string, fullName: string) {
  const supabase = getSupabaseAdmin()
  const db = getDb()
  if (!supabase || !db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Bootstrap requires Supabase and database.', 503)
  }

  const normalized = email.trim().toLowerCase()

  const invite = await supabase.auth.admin.inviteUserByEmail(normalized, {
    redirectTo: process.env.AUTH_INVITE_REDIRECT_URL?.trim() || process.env.AUTH_REDIRECT_URL,
    data: { full_name: fullName, invited_as: 'founder' },
  })

  if (invite.error || !invite.data.user) {
    throw new AppError('CONFLICT', 'Could not create founder invitation.', 409)
  }

  const authUserId = invite.data.user.id

  const [user] = await db
    .insert(users)
    .values({
      authUserId,
      email: normalized,
      fullName: fullName.trim(),
      authProvider: 'supabase',
      status: 'invited',
    })
    .onConflictDoUpdate({
      target: users.authUserId,
      set: { fullName: fullName.trim(), updatedAt: new Date() },
    })
    .returning()

  await assignRoleToUser(user.id, 'FOUNDER')
  await ensureRolePermissionsSeeded('FOUNDER')

  await db.insert(auditLogs).values({
    action: 'founder.bootstrap_invited',
    entity: 'users',
    entityId: user.id,
    metadata: JSON.stringify({ email: normalized }),
  })

  await assignMucoLoginIdIfMissing(user.id, 'FOUNDER')

  return { userId: user.id, email: normalized }
}
