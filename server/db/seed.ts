import { eq } from 'drizzle-orm'
import { getDb, closeDatabaseConnection } from './client.js'
import { roles, users, userRoles } from './schema.js'
import { permissionNames } from '../lib/auth/permissions.js'
import { roleNames } from '../lib/auth/permissions.js'
import { permissions } from './schema.js'
import { ensureRolePermissionsSeeded } from '../services/auth.service.js'
import type { RoleName } from '../lib/auth/permissions.js'

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed in production.')
    process.exit(1)
  }

  const db = getDb()
  if (!db) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  for (const name of roleNames) {
    await db
      .insert(roles)
      .values({ name, description: `Role: ${name}` })
      .onConflictDoNothing({ target: roles.name })
  }

  for (const name of permissionNames) {
    await db
      .insert(permissions)
      .values({ name, description: name })
      .onConflictDoNothing({ target: permissions.name })
  }

  for (const role of roleNames) {
    await ensureRolePermissionsSeeded(role as RoleName)
  }

  const devEmail = 'dev.customer@muco.local'
  const existing = await db.select().from(users).where(eq(users.email, devEmail)).limit(1)
  if (existing.length === 0) {
    const [user] = await db
      .insert(users)
      .values({
        email: devEmail,
        status: 'active',
        authProvider: 'development',
        fullName: 'Development Customer',
      })
      .returning()

    const [customerRole] = await db.select().from(roles).where(eq(roles.name, 'CUSTOMER')).limit(1)
    if (customerRole) {
      await db.insert(userRoles).values({ userId: user.id, roleId: customerRole.id })
    }
  }

  console.log('Development seed completed (roles, permissions, optional dev user).')
  await closeDatabaseConnection()
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
