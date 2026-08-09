import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import {
  authenticate,
  loadAuthContext,
  verifySupabaseToken,
} from '../../middleware/authenticate.js'
import {
  activateAccountIfEligible,
  registerCustomerFromAuth,
} from '../../services/auth.service.js'
import {
  formatZodErrors,
  registerCustomerSchema,
} from '../../lib/validation/auth.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import { getDb } from '../../db/client.js'
import { customerProfiles, freelancerProfiles, users } from '../../db/schema.js'
import { linkFreelancerProfileToUser } from '../../services/freelancer-network.service.js'
import { resolvePortalAccessFlags } from '../../lib/auth/portal-access.js'
import { serverEnv } from '../../lib/env.js'

export const authRoutes = new Hono()

function authRateLimit(c: { req: { header: (name: string) => string | undefined } }) {
  const limit = checkRateLimit(
    rateLimitKeyFromRequest(
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
      'auth',
    ),
    { max: serverEnv.authRateLimitMax, windowMs: serverEnv.authRateLimitWindowMs },
  )
  if (!limit.allowed) {
    throw new AppError(
      'RATE_LIMITED',
      'Too many requests. Please wait a moment and try again.',
      429,
    )
  }
}

authRoutes.post('/register', verifySupabaseToken, async (c) => {
  try {
    authRateLimit(c)
    const identity = c.get('supabaseIdentity')
    const body = await c.req.json().catch(() => ({}))
    const parsed = registerCustomerSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Please check the form and try again.',
        400,
        formatZodErrors(parsed.error),
      )
    }

    const result = await registerCustomerFromAuth(identity.id, identity.email, parsed.data)
    await activateAccountIfEligible(identity.id, identity.emailVerified)

    return jsonSuccess(c, { userId: result.userId, created: result.created }, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

authRoutes.get('/me', verifySupabaseToken, async (c) => {
  try {
    const identity = c.get('supabaseIdentity')
    await activateAccountIfEligible(identity.id, identity.emailVerified)

    const db = getDb()
    if (!db) {
      throw new AppError('SERVICE_UNAVAILABLE', 'Profile is temporarily unavailable.', 503)
    }

    const [user] = await db.select().from(users).where(eq(users.authUserId, identity.id)).limit(1)
    if (!user) {
      return jsonSuccess(c, {
        registered: false,
        email: identity.email,
        emailVerified: identity.emailVerified,
      })
    }

    let auth
    try {
      auth = await loadAuthContext(identity.id, identity.email)
    } catch (error) {
      if (error instanceof AppError && error.status === 403) {
        return jsonSuccess(c, {
          registered: true,
          email: identity.email,
          emailVerified: identity.emailVerified,
          status: user.status,
          roles: [],
          permissions: [],
          portals: {
            customer: false,
            employee: false,
            admin: false,
            freelancer: false,
          },
        })
      }
      throw error
    }

    await linkFreelancerProfileToUser(user.id, auth.email)

    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, user.id))
      .limit(1)

    const [freelancerProfile] = await db
      .select({ approvalStatus: freelancerProfiles.approvalStatus })
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, user.id))
      .limit(1)

    const portals = resolvePortalAccessFlags({
      roles: auth.roles,
      freelancerApprovalStatus: freelancerProfile?.approvalStatus ?? null,
    })

    return jsonSuccess(c, {
      registered: true,
      email: auth.email,
      emailVerified: identity.emailVerified,
      status: auth.status,
      fullName: user.fullName,
      companyName: profile?.companyName ?? null,
      roles: auth.roles,
      permissions: [...auth.permissions],
      portals,
      freelancer: freelancerProfile
        ? { approvalStatus: freelancerProfile.approvalStatus }
        : null,
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

authRoutes.get('/session', authenticate, async (c) => {
  const auth = c.get('auth')
  return jsonSuccess(c, {
    userId: auth.userId,
    email: auth.email,
    roles: auth.roles,
    permissions: [...auth.permissions],
  })
})
