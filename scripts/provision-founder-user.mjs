/**
 * One-time operator script: create founder admin (Supabase user + DB row + FOUNDER role).
 * Usage (never commit passwords):
 *   ADMIN_PROVISION_EMAIL=you@mucolabs.com
 *   ADMIN_PROVISION_PASSWORD='...'
 *   ADMIN_PROVISION_FULL_NAME='Your Name'   (optional)
 *   ADMIN_PROVISION_MUCO_ID='ADM-XXXXXXXX'  (optional)
 *   node scripts/provision-founder-user.mjs
 */
import { createClient } from '@supabase/supabase-js'
import postgres from 'postgres'
import { existsSync, readFileSync } from 'node:fs'

function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[line.slice(0, i).trim()] = v
  }
  return out
}

const fileEnv = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local') }
for (const [k, v] of Object.entries(fileEnv)) {
  if (process.env[k] === undefined) process.env[k] = v
}

const email = (process.env.ADMIN_PROVISION_EMAIL ?? '').trim().toLowerCase()
const password = process.env.ADMIN_PROVISION_PASSWORD ?? ''
const fullName = (process.env.ADMIN_PROVISION_FULL_NAME ?? 'MUCO Admin').trim()
const mucoLoginId = (process.env.ADMIN_PROVISION_MUCO_ID ?? '').trim().toUpperCase() || null

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL

if (!email || !password) {
  console.error('Set ADMIN_PROVISION_EMAIL and ADMIN_PROVISION_PASSWORD.')
  process.exit(1)
}
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).')
  process.exit(1)
}
if (!databaseUrl) {
  console.error('Missing DATABASE_URL.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const sql = postgres(databaseUrl, { max: 1 })

async function main() {
  let authUserId

  const existingAuth = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (existingAuth.error) {
    throw new Error(`listUsers: ${existingAuth.error.message}`)
  }
  const match = existingAuth.data.users.find(
    (u) => u.email?.toLowerCase() === email,
  )

  if (match) {
    authUserId = match.id
    const updated = await supabase.auth.admin.updateUserById(authUserId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, invited_as: 'founder' },
    })
    if (updated.error) {
      throw new Error(`updateUser: ${updated.error.message}`)
    }
    console.log('Updated existing Supabase user password and confirmed email.')
  } else {
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, invited_as: 'founder' },
    })
    if (created.error || !created.data.user) {
      throw new Error(`createUser: ${created.error?.message ?? 'no user'}`)
    }
    authUserId = created.data.user.id
    console.log('Created Supabase user.')
  }

  const [founderRole] = await sql`
    select id from roles where name = 'FOUNDER' limit 1
  `
  if (!founderRole) {
    throw new Error('FOUNDER role missing — run migrations / db:seed in dev.')
  }

  const [userRow] = await sql`
    insert into users (auth_user_id, email, full_name, auth_provider, status)
    values (${authUserId}, ${email}, ${fullName}, 'supabase', 'active')
    on conflict (auth_user_id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      status = 'active',
      updated_at = now()
    returning id
  `

  await sql`
    insert into user_roles (user_id, role_id)
    values (${userRow.id}, ${founderRole.id})
    on conflict do nothing
  `

  if (mucoLoginId) {
    await sql`
      update users set muco_login_id = ${mucoLoginId}, updated_at = now()
      where id = ${userRow.id}
    `
  }

  const [idRow] = await sql`
    select muco_login_id from users where id = ${userRow.id}
  `

  console.log(
    JSON.stringify({
      ok: true,
      userId: userRow.id,
      email,
      mucoLoginId: idRow?.muco_login_id ?? null,
      signInUrl: 'https://admin.mucolabs.com/admin/sign-in',
    }),
  )
}

main()
  .catch((err) => {
    console.error(err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end({ timeout: 5 })
  })
