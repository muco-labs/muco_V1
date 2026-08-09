# PHASE 4.49 — Production Operator Configuration (MASTER 22)

**Date:** 2026-08-10  
**Final status:** `READY WITH LIMITATIONS`

---

## 1. Executive summary

MASTER 22 inventories **all environment variables used in code**, documents **supported user-creation flows**, prepares a **test-identity specification** (no passwords in repo), and delivers an **operator checklist** for MASTER 23 live authentication testing. **No production configuration was applied** in this session (no Vercel/Supabase dashboard changes, no founder bootstrap, no test users created). **Vercel CLI:** unavailable in this environment — production variable presence is **VERCEL DASHBOARD VERIFICATION REQUIRED**.

Validation: **npm test** 472 passed (2 skipped), **lint PASS**, **build PASS**.

---

## 2. Environment matrix

Local status from discovery scripts; production: **VERCEL DASHBOARD VERIFICATION REQUIRED** unless noted.

| Variable | Used by | Required for auth go-live | Local | Production status |
|----------|---------|---------------------------|-------|-------------------|
| `DATABASE_URL` / `POSTGRES_*` | `getDb`, health, all portals | **Yes** | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_URL` | Server Supabase admin client | **Yes** | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT verify, invites, admin auth | **Yes** | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_ANON_KEY` | `password-login`, anon grant | **Yes** (MUCO ID login) | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_PUBLISHABLE_KEY` | Server fallback for anon | Optional alias | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_SUPABASE_URL` | Browser Supabase client | **Yes** | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser auth | **Yes** | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_SUPABASE_ANON_KEY` | Browser alias | Optional | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_SITE_URL` | SEO, canonical | **Recommended** | PRESENT | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_APP_URL` | Client default app origin | Optional | Default in code | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_API_BASE_URL` | Cross-origin API client | Optional (empty = same-origin) | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `VITE_AUTH_REDIRECT_URL` | OAuth/email redirect base | **Recommended** | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `AUTH_REDIRECT_URL` | Server invites | **Recommended** | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `AUTH_INVITE_REDIRECT_URL` | Employee/founder invite | Optional | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `FOUNDER_BOOTSTRAP_SECRET` | `POST .../bootstrap/founder` | **Yes** (founder) | **MISSING** | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `CORS_ORIGINS` | `createV1App` hono/cors | **Only if cross-origin API** | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments | Payments only | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verify | Webhooks only | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `RESEND_API_KEY` | `sendTransactionalEmail` | Optional | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `RESEND_FROM_EMAIL` | Resend from header | Optional | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `SUPABASE_STORAGE_BUCKET` | File storage | Files feature | Default `customer-files` | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `NVIDIA_API_KEY` | Website Intelligence LLM | Optional | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `NVIDIA_API_BASE_URL` / `NVIDIA_MODEL` / `NVIDIA_REQUEST_TIMEOUT_MS` | AI config | Optional | Defaults in code | N/A |
| `PAGESPEED_INSIGHTS_API_KEY` | WI performance | Optional | MISSING | VERCEL DASHBOARD VERIFICATION REQUIRED |
| `WI_*` | Crawler limits | Optional | Defaults | N/A |
| `LEAD_RATE_LIMIT_*` / `AUTH_RATE_LIMIT_*` | Rate limits | Optional | Defaults | N/A |
| `VITE_GA_MEASUREMENT_ID` / `VITE_GSC_VERIFICATION` | Analytics/SEO | Optional | MISSING | Optional |
| `VITE_PORTAL_ORIGIN_*` | Portal URL overrides | Optional | MISSING | Optional |
| `AUTH_SECRET` | `serverEnv` only | **Not used** in auth paths | MISSING | Not required |
| `SUPABASE_JWT_SECRET` | `serverEnv` | Optional | MISSING | Optional |
| `SIGNED_DOWNLOAD_TTL_SECONDS` | — | **Not an env var** | Code constant `120` in `project-file.ts` | N/A |
| `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` | — | **Not in app env** | MISSING | OAuth via **Supabase dashboard** |
| `OpenRouter` / similar | — | **Not in codebase** | N/A | N/A |
| `SECURITY_GATE_*` | Live IDOR tests (CI/local) | MASTER 23 QA only | MISSING | Operator-local |

---

## 3. Vercel requirements

**VERCEL CLI UNAVAILABLE** — use dashboard steps:

1. Vercel → `muco-labs` → `muco-v1` → Settings → Environment Variables → **Production**.
2. Set variables from §2 (auth minimum: `SUPABASE_*`, `DATABASE_URL`, `FOUNDER_BOOTSTRAP_SECRET`, `VITE_*` Supabase + site URL).
3. Optional `CORS_ORIGINS` (comma-separated, no spaces):

   `https://www.mucolabs.com,https://app.mucolabs.com,https://team.mucolabs.com,https://freelancers.mucolabs.com,https://admin.mucolabs.com`

4. Redeploy Production.
5. Confirm each portal host serves the app (already verified in MASTER 19).

---

## 4. Supabase requirements

### Callback / redirect (from code)

| Flow | Implementation |
|------|----------------|
| OAuth | `signInWithOAuth` → `redirectTo: {VITE_AUTH_REDIRECT_URL or origin}/auth/callback` (`src/services/auth.ts`) |
| Email sign-up | `emailRedirectTo: .../auth/verify-email` |
| Password reset | `redirectTo: .../auth/reset-password` |
| Invites | `AUTH_INVITE_REDIRECT_URL` or `AUTH_REDIRECT_URL` on server |

### Supabase Auth dashboard checklist

- [ ] **Site URL:** `https://www.mucolabs.com` (or primary marketing URL per policy)
- [ ] **Redirect URLs** (wildcards as supported), at minimum per host:
  - `https://www.mucolabs.com/**`
  - `https://app.mucolabs.com/**`
  - `https://team.mucolabs.com/**`
  - `https://freelancers.mucolabs.com/**`
  - `https://admin.mucolabs.com/**`
  - Local dev: `http://localhost:5173/**`
  - Preview: `https://muco-v1.vercel.app/**` (if used for QA)
- [ ] **Email/password** provider enabled
- [ ] **Google** provider (client ID/secret in Supabase only — not app env)
- [ ] **GitHub** provider (same)
- [ ] Confirm **0029** applied (MASTER 20 — column `users.muco_login_id`)

---

## 5. Founder bootstrap

| Item | Status |
|------|--------|
| Endpoint | `POST /api/v1/admin/bootstrap/founder` (unauthenticated; rate-limited) |
| Secret | `FOUNDER_BOOTSTRAP_SECRET` — if unset, endpoint returns **404** |
| Body | `{ "email", "fullName", "bootstrapSecret" }` (see `server/docs/AUTH.md`) |
| Response | `201` `{ invited: true, userId }` |
| Behavior | Supabase `inviteUserByEmail`; `users` row `invited`; `FOUNDER` role; `assignMucoLoginIdIfMissing` on registration paths |
| Idempotency | **Not fully idempotent** — repeated bootstrap may re-invite same email; operator must run **once** |
| This session | **BLOCKED** — local secret **MISSING**; bootstrap **not executed** |

**Operator steps:** Generate secret → Vercel → call bootstrap once from secure machine → founder completes invite email → sign in at `admin.mucolabs.com`.

---

## 6. Customer account flow

| Step | Mechanism |
|------|-----------|
| Self-service sign-up | `signUpCustomer` → Supabase Auth → `POST /api/v1/auth/register` |
| OAuth first sign-in | `/auth/callback` → `ensureCustomerRegistrationFromAuthUser` |
| Password sign-in gap fix | `ensureAppProfileAfterSignIn` after email/password |
| MUCO ID | Assigned on register / `/me` (`CUS-*`); login via `password-login` when ID used |
| Admin path | `inviteCustomerFromLead` (CRM) — Supabase invite + CUSTOMER role |
| Password storage | Supabase only |

**Production:** one `CUSTOMER` user (`active`, `muco_login_id` null until sign-in/`/me`).

---

## 7. Employee account flow

| Step | Mechanism |
|------|-----------|
| Creation | `POST /api/v1/admin/employees/invite` (`employees.create`, admin session) |
| Auth | Supabase `inviteUserByEmail` |
| App rows | `users` (`invited`), `EMPLOYEE` role, `employee_profiles` |
| MUCO ID | `EMP-*` on assign path |
| Login | `team.mucolabs.com` — MUCO ID or email |

---

## 8. Freelancer account flow

| Step | Mechanism |
|------|-----------|
| Application | Public `POST /api/v1/freelancers/apply` → `freelancer_profiles` (`under_review`) |
| Approval | Admin `PATCH /api/v1/admin/freelancers/:id` → `approvalStatus: approved` |
| Auth link | User signs up / signs in with **same email** → `linkFreelancerProfileToUser` on `/me` → `FREELANCER` role |
| Portal gate | `approvalStatus === 'approved'` required for freelancer portal flag |
| MUCO ID | `FLT-*` when user row exists |
| No parallel password store | Supabase only |

**Unapproved test:** application with `under_review` / rejected — portal must deny.

---

## 9. Privacy model

| Role | Architecture |
|------|----------------|
| Founder/Admin | Global authorized APIs via permissions (`requirePermission`, admin routes) |
| Employee | `requireEmployeeContext`, project membership, task assignment |
| Freelancer | Assignment + approval; no `freelancers.manage` on FREELANCER role |
| Customer | `requireCustomerContext`, `customerId` from session only |
| Client IDs | **Never** trusted for authorization |

---

## 10. CORS

- Middleware: `server/routes/v1/index.ts` — enabled **only** when `CORS_ORIGINS` is non-empty.
- `/api/health` is **outside** v1 CORS stack → `OPTIONS` **404** is expected when probing health.
- **Same-origin** model: each portal host calls its own `/api` when `VITE_API_BASE_URL` is empty → **CORS not required**.
- **Cross-origin** API (e.g. `app` UI calling `www` API): set `CORS_ORIGINS` to five production origins and redeploy; verify `OPTIONS` on `/api/v1/auth/me`.

**No code change** in MASTER 22 (behavior is intentional).

---

## 11. Google OAuth readiness

| Item | Status |
|------|--------|
| Client code | `signInWithOAuth('google')` |
| App env `GOOGLE_CLIENT_ID` | **Not used** — configure in **Supabase Auth** |
| Live test | **BLOCKED** |
| Operator | Google Cloud Console → OAuth web client → authorized origins (five hosts) → redirect URI from Supabase Google provider page |

OAuth users: **CUSTOMER** registration via callback only — **no automatic admin/employee/freelancer roles**.

---

## 12. GitHub OAuth readiness

Same as Google with GitHub OAuth App settings. **BLOCKED** for live test.

---

## 13. Email integration

| Provider | Usage |
|----------|--------|
| **Resend** | `RESEND_API_KEY` — transactional templates in `server/lib/email/templates.ts` |
| **Supabase Auth** | Sign-up verification, invites, password reset (not Resend) |

**Implemented Resend events:** `inquiry_confirmation`, `proposal_sent`, `project_started`, `invoice_issued`, `payment_confirmation`, `employee_invitation` (template exists; invite email primarily Supabase).

**Missing / not via Resend:** dedicated signup template (Supabase), password recovery content (Supabase), generic in-app notification email fan-out (uses `notifications` table; email optional).

**Policy:** Do not send test emails to real customers in MASTER 22/23 without operator approval.

---

## 14. Payment integration

| Item | Status |
|------|--------|
| Provider | Razorpay (`RAZORPAY_*`) |
| Proposal/invoice pay | Server creates orders; client checkout |
| Webhook | `POST /api/v1/webhooks/razorpay` + signature verify |
| Live payment test | **BLOCKED** (keys not verified locally) |

---

## 15. AI/API integrations

| Provider | Purpose | Env variable | Required for auth | Status |
|----------|---------|--------------|-------------------|--------|
| NVIDIA API | Website Intelligence LLM | `NVIDIA_API_KEY` | No | MISSING locally |
| Google PageSpeed | WI performance | `PAGESPEED_INSIGHTS_API_KEY` | No | MISSING locally |
| OpenRouter | — | — | — | **Not in codebase** |

---

## 16. Storage

| Item | Status |
|------|--------|
| `SUPABASE_STORAGE_BUCKET` | Default `customer-files` |
| Bucket exists in Supabase | **VERCEL/SUPABASE DASHBOARD VERIFICATION REQUIRED** |
| Signed download TTL | **120s** (code constant, max 300 in tests) |

---

## 17. Operator checklist

See [`MASTER-22-PRODUCTION-OPERATOR-CHECKLIST.md`](./MASTER-22-PRODUCTION-OPERATOR-CHECKLIST.md).

---

## 18. Test-account specification (MASTER 23)

Passwords: **operator-generated**, stored only in a password manager — **never** in git, `.env` committed files, or this report.

| Identity | Role | Creation flow | Notes |
|----------|------|---------------|-------|
| `FOUNDER_TEST` | FOUNDER | Bootstrap + invite completion | One per environment |
| `CUSTOMER_A` | CUSTOMER | Public sign-up on `app` or test email domain | Record MUCO ID after first `/me` |
| `CUSTOMER_B` | CUSTOMER | Second sign-up | IDOR pair with A |
| `EMPLOYEE_A` | EMPLOYEE | Admin invite after founder exists | Assign test project |
| `FREELANCER_A` | FREELANCER | Apply → admin approve → sign-up same email | Approved |
| `FREELANCER_UNAPPROVED` | — | Apply only; do not approve | Portal deny test |

**Existing production row:** one CUSTOMER (test-style email domain) — may serve as `CUSTOMER_A` if operator controls credentials; assign second user for B.

---

## 19. Customer / employee / freelancer data model gaps

| Entity | Present in schema | Gaps |
|--------|-------------------|------|
| Customer | `users`, `customer_profiles` (company, phone, job title, billing) | No dedicated `city` on customer profile (leads have geo); **no `last_login` column** (use Supabase Auth metadata if needed) |
| Employee | `users`, `employee_profiles` (department, jobTitle, manager) | Skills not on employee profile; assignments via `project_members` / tasks |
| Freelancer | `freelancer_profiles` + services/skills tables | Rich fields present; MUCO ID on `users` after link |

**Do not duplicate** `muco_login_id` — already on `users`.

---

## 20. Blockers (MASTER 23)

1. `FOUNDER_BOOTSTRAP_SECRET` not confirmed on Production.
2. Founder and dedicated test users not provisioned.
3. OAuth providers not verified in browser.
4. Vercel production env matrix not CLI-verified.
5. `CORS_ORIGINS` strategy not confirmed (same-origin vs cross-origin).
6. Live IDOR (`SECURITY_GATE_RUN`) not configured.
7. Browser authentication matrix not executed.

---

## 21. Recommended next step

**MASTER 23** — Operator executes checklist §D–G, then live browser + OAuth + IDOR evidence capture using operator-held credentials.

---

## Validation

| Command | Result |
|---------|--------|
| `npm test` | **PASS** (472 + 2 skipped) |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |

---

## Artifacts (uncommitted)

- `src/docs/MASTER-22-PRODUCTION-OPERATOR-CHECKLIST.md`
- `src/docs/PHASE4.49-PRODUCTION-OPERATOR-CONFIGURATION-MASTER-REPORT.md`
