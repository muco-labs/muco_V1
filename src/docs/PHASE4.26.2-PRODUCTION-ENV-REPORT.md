# Phase 4.26.2 — Production environment & database activation

**Target:** https://muco-v1.vercel.app  
**Team / project:** `muco-labs` / **`muco-v1`** (not `mucolabs` / www)  
**Date:** 2026-08-09

## Summary

**Final state: READY WITH BLOCKERS**

Infrastructure and schema work progressed; **muco-v1 Production still lacks decrypted database and service-role secrets** in this CLI session, so `/api/health` remains `database: unconfigured` and integration QA (auth, leads persistence, Razorpay, storage) cannot pass until the operator completes Vercel secret copy or Supabase integration link.

---

## 1. Environment checklist

Definitive table: [`server/docs/ENV-PRODUCTION-CHECKLIST.md`](../server/docs/ENV-PRODUCTION-CHECKLIST.md)

---

## 2. Vercel project

| Item | Value |
|------|--------|
| Team | `muco-labs` |
| Project | `muco-v1` |
| Production URL | https://muco-v1.vercel.app |
| Legacy www | Unchanged (`mucolabs` → www.mucolabs.com) |

---

## 3. Production database

| Item | Status |
|------|--------|
| Identity | Supabase **muco lab website** (`ltmaweunlnlpllrzzscq`, ap-northeast-2) — matches `SUPABASE_URL` on linked `mucolabs` Vercel project |
| Pre-migration public tables | Was empty |
| Migrations 0019–0028 (and full 0000–0028 chain) | **Applied** (29 migrations; 47 public tables; `leads` exists) |
| Destructive ops | None (no reset/drop) |
| `drizzle.__drizzle_migrations` | Table exists, **0 rows** — see checklist before `npm run db:migrate` |
| `DATABASE_URL` on muco-v1 | **Not set** (CLI cannot decrypt `mucolabs` `POSTGRES_*` pulls) |

**Code:** `server/lib/env.ts` accepts `DATABASE_URL` or Vercel `POSTGRES_PRISMA_URL` / `POSTGRES_URL`.

---

## 4. Variables configured on muco-v1 Production (names only)

**SET (this phase):**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SITE_URL`
- `VITE_AUTH_REDIRECT_URL`
- `AUTH_REDIRECT_URL`
- `SUPABASE_STORAGE_BUCKET`

**MISSING (blockers):**

- `DATABASE_URL` / `POSTGRES_URL` (or Supabase integration on muco-v1)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `FOUNDER_BOOTSTRAP_SECRET` (if bootstrap needed)
- `RESEND_*` (optional)
- `NVIDIA_API_KEY` (optional)

Helper script (non-secrets only): `node scripts/sync-muco-v1-production-env.mjs`

---

## 5–7. Supabase / Auth / Razorpay / NVIDIA

| Area | Status |
|------|--------|
| Supabase project | Active; client URLs/anon keys on muco-v1 |
| Service role | **Not on muco-v1** — auth/storage APIs return 503 until set |
| Auth redirects | **Operator:** add `https://muco-v1.vercel.app` URLs in Supabase Auth |
| Storage bucket `customer-files` | **Not created** (0 buckets) |
| Razorpay sandbox | **Not configured** on muco-v1 (keys exist on `muco-webpage-main` but masked to CLI) |
| NVIDIA | Not configured — AI safely disabled |

---

## 8–11. Post-config tests (not run — blocked)

| Test | Status |
|------|--------|
| `GET /api/health` → `database: connected` | **Blocked** (no DB URL on muco-v1) |
| `POST /api/v1/leads` success | **Blocked** |
| Auth / admin / storage / Razorpay E2E | **Blocked** |

Current health (unchanged): `database: unconfigured`, HTTP 200, fast.

---

## 12–15. Local gates (code changes)

| Gate | Result |
|------|--------|
| Tests | 353 passed |
| Lint | 0 warnings (after removing draft scripts) |
| Build | Not re-run this sub-step; prior 4.26.1 build green — run before deploy |

**Deploy:** Redeploy **after** operator adds secrets (recommended). Code change: `POSTGRES_*` fallback in `server/lib/env.ts`.

---

## 16. www

Not touched.

---

## 17. Remaining blockers (ordered)

1. **Copy or link DB credentials** to muco-v1 Production (`DATABASE_URL` or Supabase integration from project `ltmaweunlnlpllrzzscq`).
2. **Set `SUPABASE_SERVICE_ROLE_KEY`** on muco-v1 Production.
3. **Create** private Supabase Storage bucket **`customer-files`**.
4. **Supabase Auth** redirect URLs for `muco-v1.vercel.app`.
5. **Razorpay test** keys + webhook URL `https://muco-v1.vercel.app/api/v1/webhooks/razorpay`.
6. **Redeploy** muco-v1; re-probe health + leads + auth QA.
7. **Drizzle journal** — align `drizzle.__drizzle_migrations` before running `npm run db:migrate` on this database.
8. Optional: `RESEND_*`, `NVIDIA_API_KEY`, `FOUNDER_BOOTSTRAP_SECRET`.

**Not ready for www cutover (Phase 4.27)** until above pass on muco-v1.
