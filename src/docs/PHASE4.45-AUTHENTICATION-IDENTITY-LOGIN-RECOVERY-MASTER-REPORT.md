# PHASE 4.45 — Authentication, Identity & Login Recovery (MASTER 18)

**Date:** 2026-08-10  
**Final status:** `READY WITH LIMITATIONS`

---

## 1. Executive summary

MASTER 18 audited the MUCO LABS Supabase-backed authentication stack end-to-end, identified a **verified customer login failure mode** (Supabase session without application `users` row), implemented **parity with the OAuth callback** for email/password sign-in, and added a **secure MUCO login ID** path (`users.muco_login_id` → server lookup → Supabase password grant) without storing plaintext passwords in Postgres.

Remaining limitations are **operator-side**: apply migration `0029_muco_login_id.sql`, set `SUPABASE_ANON_KEY` (or publishable alias) on the server for MUCO ID login, configure founder bootstrap and OAuth providers, portal DNS (from MASTER 17), and run browser QA on production subdomains.

---

## 2. Existing auth architecture (inventory)

| Layer | Location | Role |
|--------|----------|------|
| Supabase Auth | Client `@/lib/supabase/client`, server `getSupabaseAdmin()` | Passwords, OAuth, JWT sessions |
| AuthProvider | `src/contexts/AuthProvider.tsx` | Session + `GET /api/v1/auth/me` profile |
| Token gate | `verifySupabaseToken` | Bearer JWT → `supabaseIdentity` |
| App auth | `loadAuthContext` | Requires `users.status === 'active'`, loads roles/permissions |
| API guards | `authenticate`, `requirePortal`, `requirePermission` | Server-enforced authorization |
| Portal UX | `ProtectedPortal`, `DomainPortalEnforcer` | Client routing only; APIs remain authoritative |
| Registration | `POST /api/v1/auth/register` | Creates `users` + `CUSTOMER` role + `customer_profiles` |
| Portal flags | `resolvePortalAccessFlags` | Freelancer requires `approvalStatus === 'approved'` |
| Post-login routing | `resolvePostAuthDestination` + `resolvePortalHomeUrl` | Subdomain-aware (MASTER 16) |
| Founder bootstrap | `POST /api/v1/admin/bootstrap/founder` | Invite + `FOUNDER` role (email link sets password) |

Discovery script: `node scripts/master-18-auth-discovery.mjs` (prints env presence only, no secrets).

Prior reference: `src/docs/PHASE4.42-AUTHENTICATION-OAUTH-MASTER-REPORT.md`.

---

## 3. Customer login root cause

**Symptom:** Customer enters correct Supabase email/password; sign-in appears to succeed but portal sends them to **sign-up**, **verify email**, or **unauthorized**.

**Verified logic gap (code-level):**

1. `AuthCallbackPage` calls `ensureCustomerRegistrationFromAuthUser` when `/auth/me` returns `registered: false`.
2. **`AuthSignInPage` did not** — it only called `/auth/me` and `resolvePostAuthDestination`, which sends unregistered users to `authRoutes.signUp` even when Supabase already has a valid session.

**Typical scenarios:**

- User created in Supabase (sign-up, admin invite, or password reset) but **`POST /api/v1/auth/register` never ran** or failed silently.
- User **`pending` / `invited`** until email verified; `activateAccountIfEligible` runs on `/me` when `emailVerified` is true (unchanged).
- User expects **MUCO ID** while UI was **email-only** (addressed in Phase 4 below).

**Fix:** `ensureAppProfileAfterSignIn()` after password sign-in on the public sign-in page (same provisioning path as OAuth callback).

---

## 4. Fixes implemented

| Change | Purpose |
|--------|---------|
| `src/lib/auth/ensure-app-profile-after-sign-in.ts` | Idempotent customer registration after password sign-in |
| `AuthSignInPage` | Uses helper before post-auth redirect |
| `POST /api/v1/auth/password-login` | MUCO ID → email lookup → Supabase password grant (rate-limited) |
| `users.muco_login_id` + migration `0029` | Store public login identifiers |
| `ensureMucoLoginIdForUser` | Assign/backfill `CUS-*`, `EMP-*`, `FLT-*`, `ADM-*` |
| Sign-in forms | Labels: MUCO ID or email (customer, team, admin) |
| `SUPABASE_ANON_KEY` server env | Required for server-side MUCO ID password login |
| Tests | `muco-login-id.test.ts`, `master-18-auth.test.ts` |
| Migration count test | Updated to 30 migrations |

---

## 5. Identity model

- **Authority:** Supabase Auth (password hash, sessions, OAuth).
- **Application `users`:** `auth_user_id`, email, `full_name`, `status`, **`muco_login_id`** (unique when set). `password_hash` column remains deprecated/unused.
- **Profiles:** `customer_profiles`, `employee_profiles`, `freelancer_profiles` (skills, approval, etc. unchanged).
- **MUCO login ID format:** `PREFIX-SUFFIX` (e.g. `CUS-A1B2C3D4`, `EMP-…`, `FLT-…`, `ADM-…` for founder/admin-class roles).
- **Login flow:** Identifier without `@` → `password-login` resolves ID → Supabase `signInWithPassword` on server → client `setSession`. Email login still uses direct Supabase client.

Passwords are **never** stored in profile tables.

---

## 6. Admin / founder access

- Bootstrap: `POST /api/v1/admin/bootstrap/founder` with body `{ email, fullName, bootstrapSecret }`.
- Requires **`FOUNDER_BOOTSTRAP_SECRET`** in server env (missing locally per discovery).
- Creates Supabase **invite**; founder must complete email link (set password). Status `invited` → `active` when email confirmed (`activateAccountIfEligible`).
- Admin portal access via **`FOUNDER`** / **`ADMIN`** roles (`roleCanAccessPortal`).
- Sign-in: `admin.mucolabs.com` route + MUCO ID or email (`AdminSignInPage`).

---

## 7. Employee authentication

- Admin-invited via `inviteEmployee` (Supabase invite + `EMPLOYEE` role + `employee_profiles`).
- Login: `team.mucolabs.com` (`TeamSignInPage`), MUCO ID or work email.
- Project/task isolation remains in portal services (session-derived IDs).

---

## 8. Freelancer authentication

- Unchanged approval gate: `resolvePortalAccessFlags` requires `freelancerApprovalStatus === 'approved'`.
- `linkFreelancerProfileToUser` on `/me` still runs.

---

## 9. Customer authentication

- Sign-up: Supabase `signUp` → `register` when session exists; verification path unchanged.
- Sign-in: provisioning fix + optional MUCO ID.
- `/me` returns `mucoLoginId` when column exists and assigned.

---

## 10. Session / logout

- Supabase client session + `onAuthStateChange` in `AuthProvider`.
- `signOut` clears client session and profile.
- Expired/invalid tokens: `401` from `verifySupabaseToken` with safe message.
- Inactive users: `loadAuthContext` → `403`; `/me` returns limited payload for UX (verify email / support).

---

## 11. Portal routing

Production targets (MASTER 16): `www`, `app`, `team`, `freelancers`, `admin` subdomains via `resolvePortalHomeUrl`. Local path-prefix mode preserved.

---

## 12. OAuth status

| Item | Status |
|------|--------|
| Client `signInWithOAuth` (Google/GitHub) | Implemented; redirect `/auth/callback` |
| Callback registration | `ensureCustomerRegistrationFromAuthUser` |
| Supabase provider dashboards | **BLOCKED** — external configuration required |
| Multi-origin redirect URLs | Operator must list all five production origins + localhost |

**Not claimed as PASS** without live provider tests.

---

## 13. Security isolation

- Authorization from `loadAuthContext` / `requirePermission` / service-layer session-derived IDs — unchanged.
- `password-login` uses generic failure copy for unknown ID or bad password.
- No secrets in client bundle beyond existing Supabase publishable key.

---

## 14. Tests

| Suite | Result |
|-------|--------|
| `server/lib/auth/muco-login-id.test.ts` | PASS |
| `src/lib/auth/master-18-auth.test.ts` | PASS |
| Full `npm test` | **3 failures** (pre-existing/env): live API gate timeouts; migration count updated to 30 |
| `npm run lint` | PASS |
| `npm run build` | PASS |

---

## 15. Browser QA

All production portal matrix tests: **BLOCKED** (not executed; portal DNS/subdomains not live per MASTER 17).

---

## 16. Production configuration checklist

See sections 17–18 in operator runbooks: Supabase redirect URLs, `SUPABASE_ANON_KEY`, `FOUNDER_BOOTSTRAP_SECRET`, `CORS_ORIGINS`, migration 0029, OAuth providers.

---

## 17. Blockers

1. Migration **0029** not applied until operator runs it.
2. **`SUPABASE_ANON_KEY`** missing on server — MUCO ID login returns 503 until set.
3. **`FOUNDER_BOOTSTRAP_SECRET`** missing — bootstrap returns 404.
4. **OAuth** — not configured/tested.
5. **Portal DNS** — MASTER 17.
6. **Browser QA** — not run.

---

## 18. Remaining actions

1. Apply migration 0029; verify `mucoLoginId` on `/me`.
2. Set Vercel `SUPABASE_ANON_KEY`; redeploy.
3. Founder bootstrap + invite completion; admin portal smoke test.
4. Configure OAuth; test `/auth/callback` per origin.
5. CI: investigate live gate timeouts.
6. Browser matrix when DNS is live.

---

## 19. Definition of COMPLETE

`COMPLETE` requires production migration, server anon key, verified founder and customer browser login on `app`/`admin` hosts, OAuth smoke test, and green CI.

**Recommended next MASTER:** Portal DNS go-live + cross-subdomain auth/OAuth validation (MASTER 19).
