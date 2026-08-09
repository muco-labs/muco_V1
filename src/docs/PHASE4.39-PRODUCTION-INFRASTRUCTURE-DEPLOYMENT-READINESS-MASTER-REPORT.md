# PHASE 4.39 — Production Infrastructure, Environment, Database Migration, Storage & Deployment Readiness (MASTER 13)

**Date:** 2026-08-09  
**Target deployment:** https://muco-v1.vercel.app  
**Public domain (no cutover in this master):** https://www.mucolabs.com  
**Verdict:** **READY WITH LIMITATIONS**  
**Migration / production DB risk:** **BLOCKED** for blind `npm run db:migrate` until journal baseline is operator-approved.

---

## 1. Executive summary

MASTER 13 mapped environment sources, ran a secret-pattern scan, verified the **muco-v1** Vercel deployment responds with **HTTP 200** and **database connected** on `/api/health`, inventoried the live Supabase Postgres schema (47 public tables, 18/18 focus tables present), and reconciled 29 Drizzle SQL files against the database. The **Drizzle migration journal has 0 rows** while the schema is fully populated — **running `db:migrate` without baselining is unsafe** (historically failed on duplicate enums).

Local `.env.local` has database + Supabase server/client keys but **no Razorpay**, **no founder bootstrap**, and **no NVIDIA** keys. Vercel Production env was **not** fully enumerated via CLI in this session (operator dashboard / `vercel env ls` still required for Preview vs Production matrix). Storage bucket **`customer-files`** remains **unverified** in this run (prior checklist: bucket may not exist). **www.mucolabs.com was not switched.**

Discovery automation added under `scripts/master-13-*.mjs` and `server/lib/infra/master-13-migration-safety.test.ts`.

---

## 2. Environment matrix (classification only — no values)

| Variable | Local (.env.local) | Notes |
|----------|-------------------|--------|
| `DATABASE_URL` | PRESENT | Also accepts `POSTGRES_URL` / `POSTGRES_PRISMA_URL` on Vercel |
| `POSTGRES_URL` / `POSTGRES_PRISMA_URL` | MISSING (local) | Vercel integration alias |
| `SUPABASE_URL` | PRESENT | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | PRESENT | Server only |
| `SUPABASE_ANON_KEY` | MISSING (local) | Optional server parity |
| `SUPABASE_JWT_SECRET` | MISSING | Optional |
| `VITE_SUPABASE_URL` | PRESENT | Client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | PRESENT | Client |
| `VITE_SUPABASE_ANON_KEY` | MISSING | Alias optional |
| `VITE_SITE_URL` | MISSING (local) | Build defaults to `https://mucolabs.com` via `src/config/env.ts` |
| `VITE_AUTH_REDIRECT_URL` | MISSING (local) | |
| `AUTH_REDIRECT_URL` | MISSING (local) | Required for production auth emails |
| `AUTH_INVITE_REDIRECT_URL` | MISSING | Optional |
| `AUTH_SECRET` | MISSING | Reserved; not required by current code paths |
| `FOUNDER_BOOTSTRAP_SECRET` | MISSING | Admin bootstrap |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | MISSING | Payments |
| `RAZORPAY_WEBHOOK_SECRET` | MISSING | Webhooks |
| `SUPABASE_STORAGE_BUCKET` | MISSING | Code default: `customer-files` |
| `RESEND_*` | MISSING | Optional email |
| `NVIDIA_*` | MISSING | AI optional |
| `VITE_GA_MEASUREMENT_ID` / `VITE_GSC_VERIFICATION` | MISSING | Optional SEO |
| `VERCEL_OIDC_TOKEN` | PRESENT | Local CLI only |

**Environment files:** `.env` MISSING; `.env.local` EXISTS; `.env.example` EXISTS; `.env.mucolabs.prod` / `.env.webpage.prod` EXISTS (operator pulls).

**Separation:** Development credentials in `.env.local` must not be copied to Production without review. Razorpay **sandbox ≠ live**. Supabase project should remain single source of truth until staging project exists.

---

## 3. Secret exposure audit

| Check | Result |
|-------|--------|
| `scripts/master-13-secret-scan.mjs` pattern scan | **No live secrets** in tracked source; hits only **placeholder** `postgresql://` in `.env.example` and test fixtures (`safe-audit-metadata.test.ts`) |
| `server/lib/commercial/client-bundle-secrets.test.ts` | Guards client bundle from server secret names |
| `VITE_*` forbidden secret prefixes in local env | **MISSING** (good) |
| Hardcoded `sb_secret_`, `rzp_live_`, long JWT in repo | **Not found** in application code |
| `.env.local` committed | **No** (gitignored) |

**SECRET EXPOSURE FOUND:** No production secret values in repository (pattern scan).  
**ROTATION REQUIRED:** Only if historical commits contained real credentials (operator git history audit — not performed here).

---

## 4. Vercel project audit

| Item | Evidence |
|------|----------|
| Project name | **muco-v1** (per `vercel.json`, `scripts/sync-muco-v1-production-env.mjs`, `server/docs/ENV-PRODUCTION-CHECKLIST.md`) |
| Team scope | **muco-labs** |
| Framework | Vite SPA + `api/index.ts` Hono handler (`export default { fetch }`, `runtime: nodejs`) |
| Routing | `vercel.json`: `/api/*` → `/api`; SPA fallback to `index.html` |
| Security headers | CSP, HSTS, X-Frame-Options, etc. in `vercel.json` |
| Build | `npm run build` (SEO script + `tsc` + Vite) |
| Node | `engines.node >= 20` |
| GitHub CLI / Vercel MCP | **BLOCKED** (gh not authenticated; Vercel MCP unavailable in session) |
| Live health | `GET https://muco-v1.vercel.app/api/health` → **200**, ~2.7s, `database: connected` |
| Domain | **muco-v1.vercel.app** active; **www.mucolabs.com** not reassigned in this master |

**CURRENT DEPLOYMENT:** muco-v1 on Vercel with working API health and DB probe.  
**CURRENT TARGET:** Same URL for pre-cutover QA.  
**ENV READINESS:** Partial — live DB connected on Vercel; Razorpay/storage/NVIDIA still operator-dependent per checklist.

---

## 5. Vercel environment matrix (names only)

| Variable | Local | Preview | Production | Required |
|----------|-------|---------|------------|----------|
| `DATABASE_URL` / `POSTGRES_*` | PRESENT | BLOCKED | PRESENT (health) | Yes |
| `SUPABASE_URL` + service role | PRESENT | BLOCKED | PRESENT (inferred) | Yes |
| `VITE_SUPABASE_*` | PRESENT | BLOCKED | PRESENT (checklist) | Yes |
| `VITE_SITE_URL` / auth redirects | MISSING | BLOCKED | PRESENT (checklist) | Recommended |
| `RAZORPAY_*` | MISSING | BLOCKED | MISSING (checklist) | Payments |
| `SUPABASE_STORAGE_BUCKET` | MISSING | BLOCKED | SET (checklist) | Files |
| `NVIDIA_API_KEY` | MISSING | BLOCKED | MISSING | Optional |

Preview column **BLOCKED** — run `vercel env ls --project muco-v1` as operator.

---

## 6. Database connectivity

| Probe | Result |
|-------|--------|
| Local script `master-13-schema-inventory.mjs` | CONNECTED, probe ~2.4s |
| Production `GET /api/health` | `status: ok`, `database: connected` |
| Unconfigured behavior | `database: unconfigured` (no URL) |
| Timeout | Health uses dedicated probe client, ~3.5s cap (`server/db/client.ts`) |

---

## 7. Schema inventory (live database)

| Metric | Count |
|--------|------:|
| Public base tables | 47 |
| Public enums | 31 |
| Foreign keys | 80 |
| Indexes | 149 |
| RLS-enabled tables | 47 |

**Focus tables (all EXISTS):** `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `customer_profiles`, `leads`, `proposals`, `payments`, `invoices`, `projects`, `tasks`, `files`, `notifications`, `messages`, `customer_conversations`, `customer_conversation_messages`, `audit_logs`.

**Drizzle journal:** `drizzle.__drizzle_migrations` → **0 rows** (29 SQL files on disk).

---

## 8. Migration reconciliation

**File/journal alignment:** 29 `.sql` files ↔ 29 entries in `server/db/migrations/meta/_journal.json`.

**Reconciliation summary** (`scripts/master-13-migration-reconcile.mjs`):

| Migration | Expected change | Actual DB state | Action |
|-----------|-----------------|-----------------|--------|
| `0000_initial_platform` | Core enums + 20 tables | 20/20 tables | **ALREADY APPLIED** |
| `0001`–`0018`, `0020`–`0028` (mostly ALTER / policy / enum patches) | Alter-only or mixed | Heuristic: alter-only | **REQUIRES REVIEW** (schema already matches app; individual DDL not fully diffed) |
| `0019_careers_talent` | 4 enums | 4/4 enums | **ALREADY APPLIED** |

**Counts:** ALREADY APPLIED (heuristic): 2 file-level signals; CONFLICT: 0; MISSING (greenfield): 0; REQUIRES REVIEW: 19.

**Critical finding:** Journal empty + schema populated ⇒ **`npm run db:migrate` = UNSAFE** until baseline.

### Recommended baseline strategy (document only — not executed)

1. **Freeze** production schema changes until reconcile sign-off.
2. **Export** `pg_dump --schema-only` for rollback reference.
3. **Manually verify** each migration `0020`–`0028` object (columns, enums, tables) against `information_schema` / `\d` equivalents.
4. **Option A — Journal baseline:** After verification that all 29 migrations’ effects exist, insert rows into `drizzle.__drizzle_migrations` using hashes Drizzle expects (from migration folder + Drizzle docs) — **only** with engineering + DBA approval.
5. **Option B — Forward-only:** For future changes, use a new additive migration and baseline journal to migration 29 in a **staging** database first.
6. **Never** reset, drop, or truncate production to fix journal.

---

## 9. Migration safety

| Test | Result |
|------|--------|
| Fresh DB migration chain (empty → 29 files) | **FRESH MIGRATION QA — BLOCKED** (no disposable DB in CI) |
| Blind migrate on production-like DB | **UNSAFE** (0 journal rows) |
| `server/lib/infra/master-13-migration-safety.test.ts` | PASS (29 files = 29 journal entries) |

---

## 10. Database integrity (sample probes)

| Probe | Count | Severity |
|-------|------:|----------|
| `payments.proposal_id` orphans | 0 | — |
| `files.project_id` orphans | 0 | — |
| `customer_profiles.user_id` orphans | 0 | — |

No automatic data repair performed.

---

## 11. Supabase Auth

| Item | Status |
|------|--------|
| Client `VITE_SUPABASE_*` | Configured locally |
| Server service role | Configured locally |
| Callback URLs | Operator must include `https://muco-v1.vercel.app/**` and production `https://www.mucolabs.com/**` in Supabase dashboard |
| Site URL | Can remain `https://www.mucolabs.com` until cutover |
| Email / reset | Uses `AUTH_REDIRECT_URL` / `AUTH_INVITE_REDIRECT_URL` when set |

---

## 12. Storage

| Item | Status |
|------|--------|
| Expected bucket | `customer-files` (default in `server/lib/env.ts`) |
| Env `SUPABASE_STORAGE_BUCKET` | MISSING locally (default applies) |
| Bucket existence / policies | **STORAGE BUCKET — BLOCKED** (not verified via API in this master; prior doc: create private bucket before file QA) |
| Architecture | Private bucket → server authorization → short-lived signed URLs (by design) |

**Do not** create production bucket blindly without operator approval.

---

## 13. Razorpay

| Item | Status |
|------|--------|
| Local credentials | **MISSING** |
| Vercel Production (checklist) | **MISSING** |
| Code paths | Order create, verify, webhook HMAC (`server/lib/env.ts`, commercial services) |
| Sandbox test | **RAZORPAY SANDBOX — BLOCKED** (no keys in local env) |

---

## 14. NVIDIA AI

| Item | Status |
|------|--------|
| `NVIDIA_API_KEY` | **MISSING** |
| Exposure | Server-only (`server/lib/ai/config.ts`) |
| App startup | **AI INTEGRATION — CONFIGURATION PENDING** (optional; must not break boot) |

---

## 15. Domain / DNS readiness

| Domain | Status |
|--------|--------|
| `www.mucolabs.com` / `mucolabs.com` | Public marketing site (not switched in MASTER 13) |
| `muco-v1.vercel.app` | Target QA host; health OK |
| **CUTOVER** | **CUTOVER BLOCKED** until checklist complete and explicit authorization |

---

## 16. SEO production readiness

| Item | Status |
|------|--------|
| `public/sitemap.xml` | Canonical URLs use **https://mucolabs.com** (correct for production brand) |
| `public/robots.txt` | Sitemap points to mucolabs.com; disallows portal paths |
| Build SEO script | `generate-seo.ts` writes for `VITE_SITE_URL` or default mucolabs.com |
| `VITE_GSC_VERIFICATION` / GA | Optional; not set locally |
| Staging canonical leak | muco-v1 uses checklist `VITE_SITE_URL` for QA — avoid making vercel.app canonical at cutover |

---

## 17. Health / monitoring

| Item | Status |
|------|--------|
| `/api/health` | No secrets in body (MASTER 12 test) |
| Vercel logs | Available to operator |
| Supabase logs | Dashboard |
| External APM/uptime | **Not configured** (do not claim) |
| Razorpay webhook observability | Depends on webhook + Vercel logs |

---

## 18. Backup / recovery

| Item | Status |
|------|--------|
| Supabase PITR / backups | **Operator verify** in Supabase plan dashboard |
| **BACKUP STATUS** | **UNVERIFIED** in this session |
| **ROLLBACK STATUS** | Vercel instant rollback available; DB rollback requires backup/PITR |
| Storage backup | **UNVERIFIED** |

---

## 19. CI / quality gates

| Gate | Result |
|------|--------|
| GitHub Actions | **Not present** in repo (`.github` absent) |
| `npx vitest run --pool=threads --maxWorkers=2` | **438 passed**, 2 skipped (440 total) |
| `npm run lint` (oxlint) | **0 issues** |
| `npm run build` | **PASS** |

---

## 20. Preview deployment QA (muco-v1.vercel.app)

| Route | HTTP | Notes |
|-------|------|-------|
| `/` | 200 | Homepage |
| `/api/health` | 200 | DB connected |
| `/app` | 200 | SPA shell (auth redirect client-side) |
| `/robots.txt` | 200 | Portal paths disallowed |

Full authenticated portal QA remains **BLOCKED** without test accounts / Razorpay sandbox.

---

## 21. Performance (documentation)

- Production build: largest chunk `index-*.js` ~458 kB (~129 kB gzip); portal routes lazy-loaded.
- API cold start: health ~2.7s observed (includes DB probe).
- No speculative perf changes in MASTER 13.

---

## 22. Security release audit

| Area | Status |
|------|--------|
| Secrets in client bundle | Tests + scan clean |
| Headers / CSP | `vercel.json` |
| RBAC / IDOR | MASTER 12 gate tests (live IDOR blocked without tokens) |
| Payments | Server verify + webhook secret required |
| Storage | Server-gated signed URLs (when bucket exists) |

Penetration test: **not performed**.

---

## 23. Release plan (ordered)

1. Complete migration journal reconcile / baseline (staging first).
2. Set muco-v1 Production env (DB, Supabase, Razorpay sandbox, storage bucket, redirects).
3. Deploy to Preview; smoke public + `/api/health`.
4. Sandbox payment + auth + file upload on muco-v1 host.
5. Enable monitoring checklist.
6. Production deploy (same project).
7. Post-deploy smoke.
8. **Domain cutover** only after checklist + explicit approval.
9. Switch `VITE_SITE_URL` / redirects to www as needed.

---

## 24. Rollback plan

**Triggers:** API health failure, auth widespread failure, DB errors, payment finalization failure, file access failure, severe UI regression, data integrity issue.

**Actions:** Vercel rollback to previous deployment; restore DB from Supabase backup/PITR if schema/data migration applied; revert env vars; **do not** drop tables.

---

## 25. Production cutover checklist (not executed)

- [ ] DB reconciled / journal baselined
- [ ] Migrations safe for forward changes
- [ ] Env complete on Production
- [ ] Secrets server-only verified
- [ ] Auth redirects (muco-v1 + www)
- [ ] Storage bucket + policies
- [ ] Razorpay sandbox passed
- [ ] Tests / lint / build passed
- [ ] Preview passed
- [ ] Authenticated QA passed
- [ ] Monitoring ready
- [ ] Backup verified
- [ ] Rollback documented
- [ ] SEO verified at cutover URL
- [ ] Domain DNS ready

**PRODUCTION CUTOVER = NOT READY** (journal + Razorpay + storage + backup verification open).

---

## 26. Tests

`npx vitest run --pool=threads --maxWorkers=2` → **PASS** (438 + 2 skipped).

Added: `server/lib/infra/master-13-migration-safety.test.ts`.

---

## 27. Lint

`npm run lint` → **PASS**.

---

## 28. Build

`npm run build` → **PASS**.

---

## 29. Blockers

1. **Drizzle journal empty** — blind migrate unsafe.
2. **Razorpay** credentials missing (local + checklist Production).
3. **Storage bucket** not verified/created.
4. **Backup/PITR** not verified.
5. **Vercel env matrix** Preview/Production not CLI-audited.
6. **Fresh migration QA** on empty DB not run.
7. **Founder bootstrap** secret not set locally.

---

## 30. Remaining work

- Operator: baseline `drizzle.__drizzle_migrations` after full DDL diff OR prove forward migration path on staging.
- Create/verify private `customer-files` bucket + RLS/storage policies.
- Add Razorpay **test** keys to muco-v1; run checkout + webhook on staging URL.
- `vercel env ls` + document Preview vs Production PRESENT/MISSING.
- Verify Supabase backup/PITR; optional Resend/NVIDIA/GA/GSC.
- Run `SECURITY_GATE_RUN=1` authenticated suite when bearer tokens exist.
- Optional: GitHub Actions for vitest/lint/build.

---

## 31. Final production readiness verdict

| Dimension | Verdict |
|-----------|---------|
| Infrastructure mapping | **Complete** |
| Live muco-v1 API + DB | **Connected** |
| Schema completeness | **Strong** (18/18 focus tables) |
| Migration tooling | **BLOCKED** until journal reconcile |
| Payments / storage / AI | **LIMITED** |
| Domain cutover | **Not authorized / blocked** |
| **MASTER 13 overall** | **READY WITH LIMITATIONS** |

---

## Operator commands (safe)

```bash
node scripts/master-13-env-discovery.mjs
node scripts/master-13-secret-scan.mjs
node scripts/master-13-schema-inventory.mjs
node scripts/master-13-migration-reconcile.mjs
```

**Do not run** `npm run db:migrate` on production until migration section 8 is approved.
