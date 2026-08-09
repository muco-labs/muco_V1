# PHASE 4.47 — Production Auth Activation (MASTER 20)

**Date:** 2026-08-10  
**Final status:** `READY WITH LIMITATIONS`

---

## 1. Executive summary

MASTER 20 performed **read-only discovery** plus **one targeted production DDL change**: migration **`0029_muco_login_id`** applied on the Supabase project (`muco lab website`) after verifying the column and index were **missing**. Production now has `users.muco_login_id` and partial unique index `users_muco_login_id_idx`. **1** `users` row exists; **0** rows have `muco_login_id` populated yet (backfill occurs on registration/`/me` via application code).

**Not achieved:** founder bootstrap, dedicated test-user browser QA, Google/GitHub OAuth login, CORS preflight verification (OPTIONS not handled on `/api/health`), Vercel env audit (CLI **BLOCKED**), IDOR live matrix (`SECURITY_GATE_RUN` not enabled).

**Production API:** `POST /api/v1/auth/password-login` returns **401** with generic `UNAUTHORIZED` for invalid probe credentials (no secret leakage) — indicates server password-login path is **reachable**; full MUCO ID login **not** verified with a real user.

---

## 2. Migration state

| Check | Before MASTER 20 | After MASTER 20 |
|-------|------------------|-----------------|
| `users.muco_login_id` column | **MISSING** (Supabase SQL + local read-only script) | **PRESENT** |
| `users_muco_login_id_idx` | **MISSING** | **PRESENT** |
| Supabase migration `0029_muco_login_id` | **NOT APPLIED** | **APPLIED** (`20260809200909`) |
| Repo Drizzle journal files | 30 SQL + 30 journal entries | Unchanged (repo) |
| `drizzle.__drizzle_migrations` row count (via local `DATABASE_URL`) | **0 rows** | **0 rows** (still empty; separate from Supabase migration history) |

### Safety rationale for applying 0029

- DDL is **additive only** (`ADD COLUMN IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS` with `WHERE muco_login_id IS NOT NULL`).
- No drops, no data rewrites, no journal deletion.
- **`npm run db:migrate` was not run** (per policy); applied via Supabase `apply_migration` with repo SQL content.

### Reconciliation note

Supabase tracks **30** historical migrations plus **`0029_muco_login_id`**. Local Drizzle `drizzle.__drizzle_migrations` remains **empty** — do **not** blind `db:migrate` from CI without reconciling this dual-tracking situation. Future repo migrations should be applied through the **same channel** used for production (Supabase migration pipeline or operator-run SQL matching repo files).

---

## 3. Supabase state

| Item | Status |
|------|--------|
| Project | **CONNECTED** (`ACTIVE_HEALTHY`, ap-northeast-2) |
| Auth (password) | **PRESENT** (project has anon + publishable keys; keys not printed) |
| `SUPABASE_URL` (local) | **PRESENT** |
| `SUPABASE_SERVICE_ROLE_KEY` (local) | **PRESENT** |
| `SUPABASE_ANON_KEY` (local server env) | **MISSING** (publishable available in Supabase; must be set on Vercel for server MUCO ID login if not using fallback) |
| Redirect URL matrix (dashboard) | **BLOCKED** (dashboard not audited in this session) |
| Google / GitHub providers | **BLOCKED** (not tested) |

---

## 4. Vercel environment state

| Item | Status |
|------|--------|
| Vercel CLI | **BLOCKED** (not in PATH) |
| Linked project | **PRESENT** (`muco-v1`, `.vercel/project.json`) |
| Production env variable audit | **BLOCKED** — use Vercel Dashboard → Project → Settings → Environment Variables |

**Operator dashboard checks (names only):**

- `SUPABASE_ANON_KEY` (or ensure server reads publishable alias)
- `CORS_ORIGINS` (five HTTPS origins)
- `FOUNDER_BOOTSTRAP_SECRET`
- `AUTH_REDIRECT_URL` / `AUTH_INVITE_REDIRECT_URL`
- `VITE_SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 5. CORS state

| Probe | Result |
|-------|--------|
| `OPTIONS` preflight → `https://www.mucolabs.com/api/health` from each portal origin | **404** (no CORS headers; route may not implement OPTIONS) |
| Local `CORS_ORIGINS` | **MISSING** |

**Interpretation:** Same-origin `/api` on each subdomain may work without CORS. Cross-origin API calls (e.g. `app` → `www` API) need `CORS_ORIGINS` set — **not verified PASS**.

---

## 6. Founder bootstrap

| Item | Status |
|------|--------|
| `FOUNDER_BOOTSTRAP_SECRET` (local) | **MISSING** |
| `POST /api/v1/admin/bootstrap/founder` | **BLOCKED** (secret not configured; not executed) |
| Production `users` count | **1** (identity not inspected; no founder bootstrap performed) |

---

## 7–10. Customer / employee / freelancer / admin authentication

All **BLOCKED** for live browser/session verification — no dedicated test credentials supplied. Code paths from MASTER 18 remain in production deploy.

---

## 11. Google OAuth

**BLOCKED** — no OAuth login performed; no Google env vars locally.

**Operator steps:** Google Cloud OAuth web client → authorized origins (five production hosts + localhost) → redirect URI from Supabase Auth → Google provider → enable in Supabase → test `/auth/callback` on `www` and portal hosts.

---

## 12. GitHub OAuth

**BLOCKED** — same as Google with GitHub OAuth App settings.

---

## 13. Portal routing

| Item | Status |
|------|--------|
| Subdomain HTTPS (MASTER 19) | **PASS** (still true) |
| `subdomain_root` router (code) | **PASS** |
| Live post-login redirect | **BLOCKED** (browser) |

---

## 14. IDOR / cross-portal tests

| Test | Result |
|------|--------|
| API gate unauthenticated denial | **PASS** (`npm test`, 472 passed) |
| `SECURITY_GATE_RUN=1` live IDOR | **BLOCKED** (tokens not configured) |
| Wrong portal (browser) | **BLOCKED** |

---

## 15. Security checks

| Check | Result |
|-------|--------|
| No plaintext passwords in DB schema | **PASS** |
| `password-login` error body (prod probe) | **PASS** (generic, no secrets) |
| Client bundle spot-check | **PASS** (MASTER 19; build repeated) |
| Server `requirePortal` / `authenticate` | **PASS** (code + gate tests) |

---

## 16. Live auth matrix

| Flow | Result |
|------|--------|
| Customer login | **BLOCKED** |
| Customer logout | **BLOCKED** |
| Customer refresh | **BLOCKED** |
| Employee login | **BLOCKED** |
| Employee logout | **BLOCKED** |
| Freelancer login | **BLOCKED** |
| Freelancer logout | **BLOCKED** |
| Admin login | **BLOCKED** |
| Admin logout | **BLOCKED** |
| Google login | **BLOCKED** |
| GitHub login | **BLOCKED** |
| Customer A→B IDOR | **BLOCKED** |
| Employee unauthorized project | **BLOCKED** |
| Freelancer unauthorized project | **BLOCKED** |
| Wrong portal access | **BLOCKED** |
| MUCO ID `password-login` API reachable | **PASS** (401 on invalid probe) |
| Migration 0029 DB readiness | **PASS** (column + index exist) |

---

## 17. Test results

| Suite | Result |
|-------|--------|
| `npm test` | **PASS** — 89 files, 472 passed, 2 skipped |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |

---

## 18–20. SEO regression

| URL | Result |
|-----|--------|
| `https://www.mucolabs.com/robots.txt` | **PASS** (200, www sitemap line) |
| `https://www.mucolabs.com/sitemap.xml` | **PASS** (www URLs, no `muco-v1.vercel.app`) |

---

## 21. Blockers

1. No dedicated test users / browser sessions for portal QA.
2. `FOUNDER_BOOTSTRAP_SECRET` not available locally — founder activation **BLOCKED**.
3. OAuth provider configuration and live login **BLOCKED**.
4. Vercel production env matrix **BLOCKED** (CLI).
5. `CORS_ORIGINS` unset locally; cross-origin API **not verified**.
6. `muco_login_id` backfill for existing user requires successful sign-in + `/me` (or admin script).

---

## 22. Operator actions

1. Set Vercel Production: `SUPABASE_ANON_KEY`, `CORS_ORIGINS` (comma-separated five origins), `FOUNDER_BOOTSTRAP_SECRET`.
2. Run founder bootstrap **once**; complete invite email; sign in at `admin.mucolabs.com`.
3. Create test customer/employee/freelancer users; sign in; confirm `mucoLoginId` on `/me`.
4. Configure Supabase Auth URL allow list + Google/GitHub providers.
5. Reconcile Drizzle `__drizzle_migrations` with Supabase history before any future `db:migrate` from repo tooling.
6. Run browser matrix with recorded evidence.

---

## 23. Definition of COMPLETE

`COMPLETE` requires: verified founder + role portal logins in browser, OAuth smoke test, CORS verified for intended cross-origin flows, IDOR live tests with gate tokens, and all blockers above closed with evidence.

---

## Artifacts (uncommitted)

- `scripts/master-20-readonly-db-discovery.mjs`
- `scripts/master-20-cors-auth-probe.mjs`
- `src/docs/PHASE4.47-PRODUCTION-AUTH-ACTIVATION-MASTER-REPORT.md`

## Database change (production)

- **Applied:** `0029_muco_login_id` on Supabase project `ltmaweunlnlpllrzzscq` (additive DDL only).

## Recommended next MASTER

**MASTER 21** — Test-user provisioning, founder bootstrap execution, Supabase/Vercel redirect + OAuth dashboard apply, and recorded browser QA evidence package.
