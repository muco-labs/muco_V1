# MASTER 22 — Production operator checklist

Use this checklist before **MASTER 23** live browser authentication testing.  
Mark each row: **Not configured** | **Configured** | **Verified** (never record secret values here).

---

## A. Vercel (project `muco-v1`, Production)

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `DATABASE_URL` or `POSTGRES_URL` (Supabase integration) | [ ] | [ ] | [ ] |
| `SUPABASE_URL` | [ ] | [ ] | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | [ ] | [ ] | [ ] |
| `SUPABASE_ANON_KEY` (or publishable alias for server password-login) | [ ] | [ ] | [ ] |
| `VITE_SUPABASE_URL` | [ ] | [ ] | [ ] |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | [ ] | [ ] | [ ] |
| `VITE_SITE_URL` = `https://www.mucolabs.com` | [ ] | [ ] | [ ] |
| `VITE_AUTH_REDIRECT_URL` (per-portal or www base for auth emails) | [ ] | [ ] | [ ] |
| `AUTH_REDIRECT_URL` | [ ] | [ ] | [ ] |
| `AUTH_INVITE_REDIRECT_URL` | [ ] | [ ] | [ ] |
| `FOUNDER_BOOTSTRAP_SECRET` (operator-generated, ≥8 chars) | [ ] | [ ] | [ ] |
| `CORS_ORIGINS` (only if browsers call API cross-origin; see report §CORS) | [ ] | [ ] | [ ] |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (payments) | [ ] | [ ] | [ ] |
| `RAZORPAY_WEBHOOK_SECRET` | [ ] | [ ] | [ ] |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional transactional email) | [ ] | [ ] | [ ] |
| `SUPABASE_STORAGE_BUCKET` + bucket exists in Supabase | [ ] | [ ] | [ ] |
| `NVIDIA_API_KEY` (optional Website Intelligence) | [ ] | [ ] | [ ] |
| Redeploy Production after env changes | [ ] | [ ] | [ ] |

**Dashboard:** Vercel → Team `muco-labs` → Project `muco-v1` → Settings → Environment Variables → Production.

---

## B. Supabase (project ref `ltmaweunlnlpllrzzscq`)

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| Auth → Email provider enabled | [ ] | [ ] | [ ] |
| Site URL (canonical public origin) | [ ] | [ ] | [ ] |
| Redirect URLs for all production hosts (see PHASE4.49 §4) | [ ] | [ ] | [ ] |
| Google OAuth provider | [ ] | [ ] | [ ] |
| GitHub OAuth provider | [ ] | [ ] | [ ] |
| Migration `0029_muco_login_id` applied | [ ] | [ ] | [ ] |
| Storage bucket `customer-files` (or `SUPABASE_STORAGE_BUCKET` value) | [ ] | [ ] | [ ] |
| Do **not** blind `npm run db:migrate` while `drizzle.__drizzle_migrations` is empty | [ ] | [ ] | [ ] |

---

## C. DNS

| Host | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `www.mucolabs.com` → Vercel | [ ] | [ ] | [ ] |
| `app.mucolabs.com` | [ ] | [ ] | [ ] |
| `team.mucolabs.com` | [ ] | [ ] | [ ] |
| `freelancers.mucolabs.com` | [ ] | [ ] | [ ] |
| `admin.mucolabs.com` | [ ] | [ ] | [ ] |
| Apex `mucolabs.com` → www | [ ] | [ ] | [ ] |

---

## D. Founder

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `FOUNDER_BOOTSTRAP_SECRET` on Vercel | [ ] | [ ] | [ ] |
| One-time `POST /api/v1/admin/bootstrap/founder` | [ ] | [ ] | [ ] |
| Founder completed Supabase invite email / password | [ ] | [ ] | [ ] |
| `FOUNDER` role + admin portal access | [ ] | [ ] | [ ] |
| `muco_login_id` assigned (via `/me` after login) | [ ] | [ ] | [ ] |
| Bootstrap not repeated (no duplicate founders) | [ ] | [ ] | [ ] |

---

## E. Customer (test identities)

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `CUSTOMER_A` — sign-up or admin invite flow | [ ] | [ ] | [ ] |
| `CUSTOMER_B` — second customer for IDOR tests | [ ] | [ ] | [ ] |
| MUCO IDs recorded (non-secret) for MASTER 23 | [ ] | [ ] | [ ] |
| Existing prod CUSTOMER row backfilled `muco_login_id` | [ ] | [ ] | [ ] |

---

## F. Employee

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `EMPLOYEE_A` via `POST /api/v1/admin/employees/invite` | [ ] | [ ] | [ ] |
| Invite email completed; `EMPLOYEE` role active | [ ] | [ ] | [ ] |
| Project/task assignment for isolation tests | [ ] | [ ] | [ ] |

---

## G. Freelancer

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `FREELANCER_A` — application + admin approval `approved` | [ ] | [ ] | [ ] |
| Auth user with same email; `linkFreelancerProfileToUser` | [ ] | [ ] | [ ] |
| `FREELANCER_UNAPPROVED` — application `under_review` / not approved | [ ] | [ ] | [ ] |
| Portal blocked until approved | [ ] | [ ] | [ ] |

---

## H. Google OAuth

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| Google Cloud OAuth client (web) | [ ] | [ ] | [ ] |
| Supabase Auth Google provider | [ ] | [ ] | [ ] |
| Browser login → `/auth/callback` → customer registration | [ ] | [ ] | [ ] |

---

## I. GitHub OAuth

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| GitHub OAuth App | [ ] | [ ] | [ ] |
| Supabase Auth GitHub provider | [ ] | [ ] | [ ] |
| Browser login → `/auth/callback` | [ ] | [ ] | [ ] |

---

## J. CORS

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| Confirmed API topology (same-origin per host vs cross-origin) | [ ] | [ ] | [ ] |
| If cross-origin: `CORS_ORIGINS` lists five HTTPS origins | [ ] | [ ] | [ ] |
| Preflight on real `/api/v1/*` route after deploy | [ ] | [ ] | [ ] |

---

## K. Email

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `RESEND_API_KEY` (if using app transactional email) | [ ] | [ ] | [ ] |
| Supabase Auth email (signup, invite, recovery) | [ ] | [ ] | [ ] |
| Test emails only to operator/test addresses | [ ] | [ ] | [ ] |

---

## L. Payments

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| Razorpay keys (sandbox or live per policy) | [ ] | [ ] | [ ] |
| Webhook URL registered in Razorpay dashboard | [ ] | [ ] | [ ] |
| Live payment test (MASTER 23; optional) | [ ] | [ ] | [ ] |

---

## M. Storage

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| Supabase Storage bucket exists | [ ] | [ ] | [ ] |
| File upload/download smoke test | [ ] | [ ] | [ ] |

---

## N. AI / API integrations

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `NVIDIA_API_KEY` (Website Intelligence LLM) | [ ] | [ ] | [ ] |
| `PAGESPEED_INSIGHTS_API_KEY` (optional WI) | [ ] | [ ] | [ ] |
| OpenRouter / other providers | N/A (not in codebase) | — | — |

---

## MASTER 23 prerequisites

| Item | Not configured | Configured | Verified |
|------|----------------|------------|----------|
| `SECURITY_GATE_RUN=1` + gate bearer tokens (local/CI only) | [ ] | [ ] | [ ] |
| Dedicated test passwords (operator-held, not in git) | [ ] | [ ] | [ ] |
| Browser QA evidence template ready | [ ] | [ ] | [ ] |
