# PHASE 4.48 — Production Auth Live Verification (MASTER 21)

**Date:** 2026-08-10  
**Final status:** `READY WITH LIMITATIONS`

---

## 1. Executive summary

MASTER 21 audited auth/CORS/env code paths, probed production CORS behavior, and re-ran the full validation suite. **No production schema or auth code changes** were made. **Founder bootstrap, OAuth, live login/logout, IDOR, and cross-portal browser matrices remain BLOCKED** due to missing `FOUNDER_BOOTSTRAP_SECRET` locally, no test credentials, and no OAuth operator configuration in this environment.

**CORS:** Production returns **404** on `OPTIONS` for `/api/health` and `/api/v1/*` because **`CORS_ORIGINS` is not enabled** on the server (middleware is conditional). This is **consistent with the codebase** and with **same-origin** `/api` on each host when `VITE_API_BASE_URL` is empty. It is **not** evidence of a broken authenticated API by itself.

**Production data (read-only):** One **CUSTOMER** user row (`active`); **`muco_login_id` null**; no employee/freelancer/founder rows observed.

---

## 2. Environment matrix

Local presence only. **Production Vercel values:** `VERCEL DASHBOARD VERIFICATION REQUIRED` (CLI **BLOCKED**).

| Variable | Required | Scope | Local status | Production status |
|----------|----------|-------|--------------|-------------------|
| `DATABASE_URL` | Yes | Server | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_URL` | Yes | Server | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_ANON_KEY` | Yes* | Server | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_SUPABASE_URL` | Yes | Client | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Client | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_SITE_URL` | Recommended | Client | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `FOUNDER_BOOTSTRAP_SECRET` | For bootstrap | Server | **MISSING** | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `CORS_ORIGINS` | If cross-origin API | Server | **MISSING** | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `AUTH_REDIRECT_URL` | Recommended | Server | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_AUTH_REDIRECT_URL` | Recommended | Client | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `RAZORPAY_*` | Payments only | Server | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |

\*Required for server `POST /api/v1/auth/password-login` unless publishable key aliases are set on Vercel (production probe in MASTER 20 returned **401**, implying server auth path is configured).

Artifact: `src/docs/master-21-env-cors-probe.json`

---

## 3. CORS findings

| Question | Answer |
|----------|--------|
| Global OPTIONS handler? | **No** — `hono/cors` mounts only when `serverEnv.corsOrigins.length > 0` (`createV1App`) |
| `/api/health` OPTIONS? | **Not applicable** — health lives on root `createApp()` **outside** v1 CORS stack |
| Real API OPTIONS (prod) | **404** on `/api/v1/auth/me`, `/api/v1/leads` (all five origins probed) |
| GET with `Origin` header | **401** on `/api/v1/auth/me`, **no** `Access-Control-Allow-Origin` (CORS off) |
| Is `CORS_ORIGINS` required? | **Only** if browser calls API on a **different origin** than the SPA |
| Five origins supported when set? | **Yes (code)** — comma-separated list passed to `cors({ origin: serverEnv.corsOrigins })` |

**Verdict:** **PASS (architecture)** for same-origin deployment; **BLOCKED** for cross-origin API until operator sets `CORS_ORIGINS` and redeploys. **No code change** applied (behavior matches design).

---

## 4. Founder bootstrap

| Item | Result |
|------|--------|
| `FOUNDER_BOOTSTRAP_SECRET` (local) | **MISSING** |
| Bootstrap executed | **BLOCKED** |
| Founder/admin user in DB | **BLOCKED** (no founder row; only one CUSTOMER) |

**Operator:** Generate secret → Vercel Production → `POST /api/v1/admin/bootstrap/founder` once → complete invite email → sign in at `admin.mucolabs.com`.

---

## 5. Customer QA

| Step | Result |
|------|--------|
| `app.mucolabs.com/auth/sign-in` loads | **PASS** (URL reachable; SPA shell) |
| MUCO ID + password login | **BLOCKED** (no credentials) |
| Session / dashboard / refresh / logout | **BLOCKED** |
| CUSTOMER_A → CUSTOMER_B IDOR | **BLOCKED** |

**Note:** Production has one CUSTOMER account (`active`, `muco_login_id` null). Operator must use **dedicated test credentials**; passwords must not be stored in repo/reports.

---

## 6. Employee QA

**BLOCKED** — no employee user rows; no test credentials.

---

## 7. Freelancer QA

**BLOCKED** — no freelancer user rows; no approved/unapproved test users.

---

## 8. Admin QA

**BLOCKED** — no founder/admin user; bootstrap not run.

---

## 9. Google OAuth

| Item | Result |
|------|--------|
| Repo implementation | **PRESENT** (`signInWithOAuth`, `/auth/callback`) |
| Google env (local) | **MISSING** |
| Live browser login | **BLOCKED** |

**Operator:** Google Cloud OAuth web client → Supabase Auth Google provider → redirect URLs for all production hosts + `/auth/callback`.

---

## 10. GitHub OAuth

**BLOCKED** — same as Google with GitHub OAuth App settings.

---

## 11. Cross-portal isolation

| Test | Result |
|------|--------|
| API `requirePortal` / gate tests | **PASS** (`npm test`) |
| Live browser cross-host sessions | **BLOCKED** |
| `DomainPortalEnforcer` (code) | **PASS** |

---

## 12. IDOR

| Test | Result |
|------|--------|
| Unauthenticated API boundary | **PASS** |
| `SECURITY_GATE_RUN=1` live IDOR | **BLOCKED** (tokens not configured) |

---

## 13. Security

| Check | Result |
|-------|--------|
| Plaintext passwords in DB | **PASS** |
| Service role / DB URL in client bundle | **PASS** (prior scans + build) |
| Generic auth errors (prod password-login probe) | **PASS** (MASTER 20) |
| Server-side authorization | **PASS** (code + tests) |

---

## 14. Tests

`npm test`: **PASS** — 89 files, 472 passed, 2 skipped.

---

## 15. Lint

**PASS**

---

## 16. Build

**PASS**

---

## 17. SEO

| Check | Result |
|-------|--------|
| `robots.txt` | **PASS** (200, www) |
| `sitemap.xml` | **PASS** (www, no `muco-v1.vercel.app`) |

---

## 18. Live auth matrix

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
| Wrong portal access (browser) | **BLOCKED** |
| Sign-in route reachable (app host) | **PASS** |
| CORS same-origin model | **PASS** |
| CORS cross-origin (five origins) | **BLOCKED** until `CORS_ORIGINS` set |

---

## 19. Operator actions

1. Set Vercel Production: `FOUNDER_BOOTSTRAP_SECRET`, `SUPABASE_ANON_KEY`, `CORS_ORIGINS` (if cross-origin API needed), auth redirect URLs.
2. Run founder bootstrap once; verify admin login.
3. Create dedicated test users (customer A/B, employee, approved/unapproved freelancer) via admin flows.
4. Configure Supabase redirect URLs + Google/GitHub providers.
5. Run browser QA with recorded evidence; set `SECURITY_GATE_RUN=1` + gate bearer tokens for IDOR subtests.
6. Backfill `muco_login_id` via sign-in + `/me` for existing CUSTOMER row.

---

## 20. Definition of COMPLETE

`COMPLETE` requires verified founder/admin and role-specific browser logins, OAuth smoke test, optional CORS verification for chosen API topology, live IDOR gate pass, and documented test accounts — **with evidence**, not assumptions.

---

## Artifacts (uncommitted)

- `scripts/master-21-env-cors-discovery.mjs`
- `src/docs/master-21-env-cors-probe.json`
- `src/docs/PHASE4.48-PRODUCTION-AUTH-LIVE-VERIFICATION-MASTER-REPORT.md`

## Recommended next MASTER

**MASTER 22** — Operator-led execution: Vercel/Supabase dashboard apply, founder bootstrap, provision test identities, scripted + browser evidence capture.
