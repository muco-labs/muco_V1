# Phase 4.25 — Production Readiness, Zero-Warning Cleanup & Go-Live

## Executive summary

**Final readiness: NOT READY**

The **muco_V1** codebase meets local engineering gates (**351 tests**, **0 lint warnings**, **build pass**). Production go-live on **www.mucolabs.com** is **not** complete: the apex/www domain still serves the **legacy `mucolabs` Vercel project**, while **`muco-v1`** exists as a separate deployment. This workspace has **no `.env`**, so database migrations, Supabase auth, Razorpay sandbox, and end-to-end business flows were **not** verified here.

**Engineering completed in this phase:** zero-warning lint cleanup, auth context split, shared control-character validation, **NVIDIA AI server-side foundation** (no public AI features), deployment documentation, Vercel project discovery.

**Operator actions required:** set Vercel production env vars, run `npm run db:migrate`, configure Supabase/Razorpay/webhooks, validate on `muco-v1.vercel.app`, then **domain cutover** from `mucolabs` → `muco-v1` when approved.

---

## 1. Current production status

| Surface | URL | Application | Status |
|---------|-----|-------------|--------|
| Public (canonical today) | `https://www.mucolabs.com` | Vercel project **`mucolabs`** | **Legacy** — not muco_V1 API (`/api/v1/leads` 404) |
| V1 candidate | `https://muco-v1.vercel.app` | Vercel project **`muco-v1`** | **Exists** — env/integration not verified from this session |
| Git | `muco-labs/muco_V1` `main` | Source | Up to date through Phase 4.24 + 4.25 fixes (pending commit) |

**HTTPS:** working on www (Vercel).

**`npx vercel deploy --prod`:** **not run** — critical secrets and E2E gates not satisfied in this environment.

---

## 2. Vercel

| Item | Value |
|------|--------|
| Account | `mucolabs2026-9968` |
| Team (scope) | **`muco-labs`** (also `muco-team`) |
| Target project for this repo | **`muco-v1`** (`https://muco-v1.vercel.app`) |
| Legacy production domain project | **`mucolabs`** → `www.mucolabs.com` |
| Local `.vercel` link | **Not created** (avoid committing link metadata) |
| Build command | `npm run build` |
| Output | `dist/` + serverless `api/index.ts` |
| Node | `>=20` (Vercel projects on 24.x) |

**Domain cutover:** Assign `www.mucolabs.com` / apex to **`muco-v1`** only after staging QA and env configuration. Until then, **do not** claim muco_V1 is live on www.

---

## 3. Issues found → fixed

| Issue | Fix |
|-------|-----|
| 3 oxlint warnings (control-regex, fast-refresh export) | `control-char.ts` helpers; split `useAuth` → `auth-context.ts` |
| No NVIDIA integration hook | Server-only `server/lib/ai/*` + admin integration health |
| Migration doc stale (0007 only) | `DEPLOYMENT.md` updated to 0028 |
| Phase 4.25 report draft | This document |

**Not fixable without secrets:** DB migrate, auth E2E, Razorpay sandbox, storage, email send, production deploy to www.

---

## 4. Files changed (Phase 4.25 engineering)

- `server/lib/validation/control-char.ts`, `leads.ts`, `project-intake.ts`
- `src/lib/validation/control-char.ts`, `safe-return-path.ts`
- `src/contexts/auth-context.ts`, `AuthProvider.tsx`, useAuth imports (22 files)
- `server/lib/ai/config.ts`, `nvidia-provider.ts`, `nvidia-provider.test.ts`
- `server/services/admin.service.ts` (integration status `ai.nvidia`)
- `.env.example` (NVIDIA placeholders)
- `server/docs/DEPLOYMENT.md`
- `src/docs/PHASE4.25-PRODUCTION-DEPLOYMENT-REPORT.md` (this file)

---

## 5. Environment variables

### Required for full production

| Variable | Class |
|----------|--------|
| `DATABASE_URL` | SECRET |
| `SUPABASE_URL` | SERVER |
| `SUPABASE_SERVICE_ROLE_KEY` | SECRET |
| `VITE_SUPABASE_URL` | PUBLIC |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | PUBLIC |
| `RAZORPAY_KEY_ID` | SERVER |
| `RAZORPAY_KEY_SECRET` | SECRET |
| `RAZORPAY_WEBHOOK_SECRET` | SECRET |
| `VITE_SITE_URL` | PUBLIC (use `https://www.mucolabs.com` if www is canonical) |
| `SUPABASE_STORAGE_BUCKET` | SERVER (default `customer-files`) |

### Recommended

`AUTH_REDIRECT_URL`, `VITE_AUTH_REDIRECT_URL`, `AUTH_INVITE_REDIRECT_URL`, `FOUNDER_BOOTSTRAP_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CORS_ORIGINS` (if split origins)

### AI foundation (optional until LLM features ship)

| Variable | Class |
|----------|--------|
| `NVIDIA_API_KEY` | SECRET |
| `NVIDIA_API_BASE_URL` | SERVER (optional) |
| `NVIDIA_MODEL` | SERVER (optional) |
| `NVIDIA_REQUEST_TIMEOUT_MS` | SERVER (optional) |

### Not used in repo

`FORM_TOKEN_SECRET` — not referenced.

---

## 6. Database / migrations

| Item | Status |
|------|--------|
| Files `0018`–`0028` | Present |
| Journal `0000`–`0028` | Contiguous |
| `npm run db:migrate` | **NOT RUN** — **DATABASE CONFIGURATION BLOCKED** (no `DATABASE_URL` in workspace) |

**Command when configured:** `DATABASE_URL=... npm run db:migrate`

---

## 7. NVIDIA integration status

| Item | Status |
|------|--------|
| Public AI chatbot | **Not added** |
| Provider abstraction | **`nvidiaChatCompletion`** in `server/lib/ai/nvidia-provider.ts` |
| Configuration | `NVIDIA_API_KEY` server-only |
| Health | `getIntegrationStatus().ai.nvidia` (admin API — no key material) |
| Website Intelligence | Existing crawl/PageSpeed pipeline **unchanged**; LLM can be wired later |
| Tests | 3 unit tests (not configured path) |

---

## 8. Public website / homepage (source audit)

Homepage (`HomePage.tsx`) implements the intended hierarchy: **SignatureHero** → trust → story → services → culture → systems → founder → team → engagement → FAQ. Structured data: Organization, WebSite, LocalBusiness, FAQ.

**No fake testimonials/stats added.** Team/founder sections use existing content modules (`home-v3/*`).

**Browser QA (local dev, Phase 4.24):** public routes load after lazy chunks. **Not re-run** on `muco-v1.vercel.app` in this session (network probe slow).

---

## 9–17. CRM, customer, proposals, payments, files, messaging, careers, freelancer

**NOT TESTED** end-to-end in Phase 4.25 (no database, no Supabase, no test accounts). Architecture verified in prior phases + **351** automated tests covering RBAC, payments signatures, freelancer hardening, IDOR patterns.

---

## 18. Security

Codebase: server-side auth, payment verify, webhook HMAC, signed storage URLs, customer scoping (unchanged). **Production penetration test:** not performed.

---

## 19–21. Test / build / lint

| Gate | Result |
|------|--------|
| `npx vitest run --pool=threads --maxWorkers=2` | **351 passed** (60 files) |
| `npm run build` | **pass** |
| `npm run lint` (oxlint) | **0 warnings, 0 errors** |

---

## 22. Browser QA

| Area | Result |
|------|--------|
| Local public routes (4.24) | PASS (limited) |
| `muco-v1.vercel.app` | NOT TESTED (this session) |
| www legacy | Confirmed **not** muco_V1 |
| Authenticated portals | BLOCKED |

---

## 23. Go-live gate checklist

| Item | Done |
|------|------|
| Production URL works (V1 on www) | ☐ |
| HTTPS | ☑ (www) |
| Build / test / lint zero issues | ☑ |
| Database + migrations | ☐ |
| Supabase + storage | ☐ |
| Auth E2E | ☐ |
| CRM / Start Project E2E | ☐ |
| Razorpay sandbox | ☐ |
| Domain cutover to muco-v1 | ☐ |
| NVIDIA key in Vercel (optional) | ☐ |

---

## 24. Remaining blockers

1. Production env vars on Vercel project **`muco-v1`**
2. Database migrate on production/staging Postgres
3. Supabase redirect URLs + private bucket
4. Razorpay webhook → `https://<host>/api/v1/webhooks/razorpay`
5. Staging E2E QA (Phase 4.24 matrix) on **`muco-v1.vercel.app`**
6. Business-approved **domain cutover** from **`mucolabs`** to **`muco-v1`**

---

## 25. Exact deployment status

**NOT READY** for declaring **MUCO Labs LIVE** on the full V1 platform at **www.mucolabs.com**.

**READY WITH BLOCKERS** for **code merge** (local gates green); **NOT READY** for **customer-facing go-live**.

---

## 26. Next steps (operator)

1. Vercel → **muco-v1** → Environment Variables (production).
2. `npm run db:migrate` against that database.
3. Supabase + Razorpay + Resend as documented in `server/docs/DEPLOYMENT.md`.
4. Smoke-test `https://muco-v1.vercel.app` (health, sign-in, start project).
5. Razorpay **test** payment once.
6. Promote **`muco-v1`** to `www.mucolabs.com` when QA passes.

**No Phase 4.26.** Post-go-live: focused bug-fix tasks only.
