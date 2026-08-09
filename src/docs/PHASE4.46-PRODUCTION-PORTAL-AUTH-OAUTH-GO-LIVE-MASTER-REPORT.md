# PHASE 4.46 — Production Portal, Auth & OAuth Go-Live (MASTER 19)

**Date:** 2026-08-10  
**Final status:** `READY WITH LIMITATIONS`

---

## 1. Executive summary

MASTER 19 re-verified production hosting, DNS/HTTPS, SEO artifacts, migration inventory, security gates, and environment assumptions. **Portal subdomains now resolve over HTTPS to Vercel** (improvement since MASTER 17). Production API health reports **database connected**. **Migration 0029 was not applied** (no production schema probe run; `db:migrate` not executed). **Live auth/OAuth/browser matrix remains BLOCKED** without operator dashboard access, production `SUPABASE_ANON_KEY` / `CORS_ORIGINS` / founder bootstrap confirmation, and dedicated test credentials.

**Live API gate timeouts** from MASTER 18 were **reproduced and fixed** in-repo: cold-start of `/api/v1/customer/dashboard` under full parallel Vitest exceeded the 15s per-test limit; warming that route in `beforeAll` restores stable CI behavior (`472` tests pass).

---

## 2. DNS status

| Host | DNS/HTTPS | HTTP | Evidence |
|------|-----------|------|----------|
| `mucolabs.com` | PASS | 308 → `www` | `master-19-go-live-probe.json` |
| `www.mucolabs.com` | PASS | 200 | Vercel `server`, TLS |
| `app.mucolabs.com` | PASS | 200 | Vercel |
| `team.mucolabs.com` | PASS | 200 | Vercel |
| `freelancers.mucolabs.com` | PASS | 200 | Vercel |
| `admin.mucolabs.com` | PASS | 200 | Vercel |

**Note:** All hosts serve the same SPA `index.html` shell (expected for one Vercel project). **Runtime** portal selection uses `resolveApplicationDomain` + `subdomain_root` routing (`src/app/router.tsx`) — **not verified in browser** this session.

---

## 3. Vercel domain status

| Item | Status |
|------|--------|
| Linked project (`muco-v1`, `prj_pHjdu8E8zF8EN3HjAzoT3nJcjmT4`) | PRESENT (`.vercel/project.json`) |
| `www` + portal hosts reachable | PASS (live fetch) |
| Vercel CLI domain/env audit | **BLOCKED** (`vercel` not available in this environment) |

---

## 4. Supabase status

| Item | Local `.env` | Production inference |
|------|--------------|----------------------|
| `SUPABASE_URL` | PRESENT | Assumed PRESENT (auth works on prod health path) |
| `SUPABASE_SERVICE_ROLE_KEY` | PRESENT | **BLOCKED** (not readable from here) |
| `SUPABASE_ANON_KEY` | **MISSING** | **BLOCKED** — required for MUCO ID `password-login` on server |
| Redirect URL matrix (5 origins) | Not in repo | **BLOCKED** — Supabase dashboard |
| OAuth providers | N/A | **BLOCKED** — dashboard |

Callback path in code: **`/auth/callback`** (`src/services/auth.ts` → `redirectTo: .../auth/callback`).

---

## 5. Migration status

| Check | Result |
|-------|--------|
| SQL migration files | **30** |
| Drizzle journal entries | **30** (includes `0029_muco_login_id`) |
| `0029` content | Adds `users.muco_login_id` + partial unique index |
| `npm run db:migrate` | **NOT RUN** (per safety policy) |
| Production column exists? | **BLOCKED** — no read-only SQL executed |
| Historical `__drizzle_migrations` drift | **BLOCKED** — requires production DB inspection |

### Safe reconciliation plan (operator)

1. **Backup** production Postgres.
2. **Read-only:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'muco_login_id';`
3. **Read-only:** `SELECT COUNT(*), MAX(created_at) FROM drizzle.__drizzle_migrations;` (or actual migrations table name).
4. **If column already exists** and matches `0029`: insert journal row for `0029` only if missing — **do not re-apply DDL**.
5. **If column missing** and journal shows consistent history: apply **only** `0029_muco_login_id.sql` via controlled migration path agreed with your Drizzle baseline policy.
6. **If journal empty/inconsistent with live schema:** **STOP** — manual reconcile per MASTER 13 runbook; never blind `db:migrate`.

---

## 6. Customer auth

| Test | Result |
|------|--------|
| Code path (sign-in, register, `ensureAppProfileAfterSignIn`) | PASS (code review) |
| Live signup/login on `app.mucolabs.com` | **BLOCKED** (no test account) |
| MUCO ID login in production | **BLOCKED** (`SUPABASE_ANON_KEY` + migration 0029) |

---

## 7. Employee auth

| Test | Result |
|------|--------|
| `team.mucolabs.com` HTTPS | PASS |
| Live employee login / project scope | **BLOCKED** |

---

## 8. Freelancer auth

| Test | Result |
|------|--------|
| `freelancers.mucolabs.com` HTTPS | PASS |
| Approval gate (`resolvePortalAccessFlags`) | PASS (unit tests) |
| Live freelancer login | **BLOCKED** |

---

## 9. Admin auth

| Test | Result |
|------|--------|
| `admin.mucolabs.com` HTTPS | PASS |
| `FOUNDER_BOOTSTRAP_SECRET` (local) | **MISSING** |
| Founder bootstrap execution | **BLOCKED** (no secret; not invented) |
| Live admin login | **BLOCKED** |

---

## 10. MUCO login ID

| Item | Result |
|------|--------|
| Schema + API in repo | PRESENT (MASTER 18) |
| Production column | **BLOCKED** |
| `POST /api/v1/auth/password-login` on production | **BLOCKED** until anon key + column |
| Uniqueness / negative tests | PASS (unit tests only) |

---

## 11. Google OAuth

**BLOCKED** — no `GOOGLE_CLIENT_ID` / secret in local env; no Supabase dashboard access; no live login performed.

**Operator steps (when credentials exist):**

1. Google Cloud Console → OAuth client (Web).
2. Authorized JavaScript origins: all five `https://*.mucolabs.com` production origins + localhost dev.
3. Authorized redirect URIs: Supabase project callback URL from Supabase Auth → Providers → Google.
4. Supabase: enable Google provider; paste client ID/secret.
5. Supabase Auth → URL configuration: add all five site origins + `/auth/callback` paths per origin policy.

---

## 12. GitHub OAuth

**BLOCKED** — same as Google; use GitHub OAuth App callback to Supabase.

---

## 13. Portal routing

| Mechanism | Status |
|-----------|--------|
| `resolvePortalHomeUrl` / MASTER 16 domains | PASS (code + existing tests) |
| `subdomain_root` router for `app.*`, `team.*`, etc. | PASS (code) |
| Production path `/app`, `/team` on www | Legacy path-prefix mode for localhost; production uses subdomains |
| Live redirect after login | **BLOCKED** (browser) |

---

## 14. Wrong-host / portal enforcement

| Layer | Enforcement |
|-------|-------------|
| API | `authenticate` + `requirePortal('customer'|'employee'|'admin'|…)` on portal routes |
| UX | `ProtectedPortal` + `canAccessPortal` from `/auth/me` flags |
| Hostname | `DomainPortalEnforcer` redirects wrong subdomain to correct portal home (UX; not authorization) |

**Live cross-portal session tests:** **BLOCKED** (no credentials).

**API gate tests:** PASS (unauthenticated `401`/`403` on protected routes).

---

## 15. CORS

| Item | Local | Production |
|------|-------|------------|
| `CORS_ORIGINS` | **MISSING** | **BLOCKED** (Vercel env not readable) |

When empty, server uses same-origin `/api` only (`server/routes/v1/index.ts`). **Cross-subdomain API calls** (e.g. `app` → `www` API) require explicit `CORS_ORIGINS` listing all five HTTPS origins — **verify on Vercel**.

---

## 16. Security

| Check | Result |
|-------|--------|
| Production `dist/` scan for `SERVICE_ROLE`, `postgresql://` | PASS (no matches in sampled client bundles) |
| Passwords in app tables | PASS (Supabase-only; deprecated `password_hash` unused) |
| Gate tests: no secret leakage in error bodies | PASS |
| Server-derived authorization | PASS (architecture unchanged) |

---

## 17. Live browser QA

| Portal | Load (HTTPS) | Sign-in / dashboard / logout | Verdict |
|--------|--------------|------------------------------|---------|
| www | PASS | **BLOCKED** | No test session |
| app | PASS | **BLOCKED** | No customer test account |
| team | PASS | **BLOCKED** | No employee test account |
| freelancers | PASS | **BLOCKED** | No freelancer test account |
| admin | PASS | **BLOCKED** | No admin test account |

---

## 18. API gate timeout investigation

**Symptom:** `GET /api/v1/customer/dashboard` without token timed out at **15000ms** when running the **full** Vitest suite (2 files failed).

**Root cause:** First request to `/api/v1/customer/dashboard` triggers **heavy lazy imports** (customer services). Under **parallel test workers**, cold start exceeded the per-test timeout. The route itself returns quickly when warmed (~4–5s isolated; unauthenticated `401`).

**Fix (in repo, not committed per user rule — local working tree):**

- `beforeAll` in `server/security/master-12-gate.test.ts` and `auth-gate.live.test.ts` now warms `/api/v1/customer/dashboard` and extends hook timeout to 45s.

**After fix:** `npm test` → **89 files, 472 passed**, 2 skipped.

---

## 19. SEO regression

| URL | Result |
|-----|--------|
| `https://www.mucolabs.com/robots.txt` | PASS (200) |
| `https://www.mucolabs.com/sitemap.xml` | PASS — contains `www.mucolabs.com`, **no** `muco-v1.vercel.app` |
| Canonical build origin | PASS (`generate-seo` → `https://www.mucolabs.com`) |

---

## 20. Environment matrix (local discovery only)

| Variable | Status |
|----------|--------|
| `DATABASE_URL` | PRESENT |
| `SUPABASE_URL` | PRESENT |
| `SUPABASE_SERVICE_ROLE_KEY` | PRESENT |
| `SUPABASE_ANON_KEY` | **MISSING** |
| `VITE_SUPABASE_*` | PRESENT (publishable) |
| `VITE_SITE_URL` | PRESENT |
| `CORS_ORIGINS` | **MISSING** |
| `FOUNDER_BOOTSTRAP_SECRET` | **MISSING** |
| `AUTH_REDIRECT_URL` / `VITE_AUTH_REDIRECT_URL` | **MISSING** |
| Google/GitHub OAuth env | **MISSING** |

Production Vercel values: **BLOCKED** (CLI unavailable).

---

## 21. Exact blockers

1. Production **`users.muco_login_id`** not verified / 0029 not applied.
2. **`SUPABASE_ANON_KEY`** on Vercel for MUCO ID server login.
3. **`CORS_ORIGINS`** for multi-subdomain browser API access (if APIs are cross-origin).
4. **`FOUNDER_BOOTSTRAP_SECRET`** + one-time founder invite completion.
5. **Supabase** redirect URL + OAuth provider configuration.
6. **Dedicated test accounts** for live browser QA.
7. **Vercel CLI / dashboard** audit not run in this environment.

---

## 22. Exact operator actions

1. Run read-only SQL checks (migration section); apply `0029` only if safe.
2. Set Vercel Production: `SUPABASE_ANON_KEY`, `CORS_ORIGINS` (five origins), `FOUNDER_BOOTSTRAP_SECRET`, `AUTH_REDIRECT_URL` / invites URL.
3. Supabase Auth → URL Configuration: Site URL + redirect allow list for all portal origins; callback `/auth/callback`.
4. Enable Google/GitHub in Supabase; configure OAuth apps.
5. Bootstrap founder once; sign in at `admin.mucolabs.com`.
6. Create isolated test users (customer, employee, approved freelancer); run browser matrix.
7. Commit/push gate-test warmup when ready.

---

## 23. Definition of COMPLETE

`COMPLETE` requires: 0029 applied in production, Vercel auth env complete, founder admin login verified in browser, each portal login/logout verified, OAuth smoke-tested on at least one provider, CORS verified from each origin, and full CI green — **with evidence**, not assumptions.

---

## Artifacts

- `scripts/master-19-production-go-live-discovery.mjs`
- `src/docs/master-19-go-live-probe.json` (generated 2026-08-09T20:01:44Z)

## Files changed (MASTER 19, uncommitted)

| File | Change |
|------|--------|
| `server/security/master-12-gate.test.ts` | Warmup + timeout fix |
| `server/security/auth-gate.live.test.ts` | Warmup + timeout fix |
| `scripts/master-19-production-go-live-discovery.mjs` | **Created** |
| `src/docs/master-19-go-live-probe.json` | **Created** (probe output) |
| `src/docs/master-17-hosting-probe.json` | Refreshed by MASTER 17 script run |

## APIs / database / security changes

- **APIs:** none (verification master)
- **Database:** none executed
- **Security:** test hardening only (gate warmup)

## Validation (this session)

| Command | Result |
|---------|--------|
| `npm test` | **PASS** (472 + 2 skipped) |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |

## Recommended next MASTER

**MASTER 20** — Operator execution track: production migration 0029 reconcile, Vercel/Supabase config apply, founder bootstrap, scripted smoke tests with `SECURITY_GATE_RUN=1` bearers, and recorded browser QA evidence.
