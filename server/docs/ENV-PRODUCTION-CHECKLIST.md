# Production environment checklist (muco-v1)

Cross-checked against `server/lib/env.ts`, `server/lib/ai/config.ts`, `src/config/env.ts`, email, website intelligence, and `process.env` usage in `server/`.

**Vercel target:** team `muco-labs`, project **`muco-v1`**, Production only (not legacy `mucolabs` / `www`).

| Variable | Purpose | Server / Client | Required | Used by | Vercel Production |
|----------|---------|-----------------|----------|---------|-------------------|
| `DATABASE_URL` | PostgreSQL for API + Drizzle | Server | **Required** | `getDb()`, migrations, auth context | **Operator** (or `POSTGRES_*` via integration — see below) |
| `POSTGRES_URL` | Vercel Supabase integration pooled URI | Server | Optional alias | `serverEnv.databaseUrl` fallback | If Supabase integration linked |
| `POSTGRES_PRISMA_URL` | Vercel Supabase integration (Prisma-style) | Server | Optional alias | Same | If integration linked |
| `SUPABASE_URL` | Supabase project API URL | Server | **Required** for auth/storage | `getSupabaseAdmin()`, auth | **SET** on muco-v1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Auth + storage (server only) | Server | **Required** for portals | `server/lib/supabase.ts` | **MISSING** — copy from `mucolabs` or Supabase dashboard |
| `SUPABASE_ANON_KEY` | Legacy server reference (optional) | Server | Optional | Rare / parity with integration | **SET** on muco-v1 |
| `SUPABASE_JWT_SECRET` | Documented for JWT (optional if using service role `getUser`) | Server | Optional | `serverEnv` only | **MISSING** — optional |
| `VITE_SUPABASE_URL` | Browser Supabase client | Client | **Required** for sign-in | `src/config/env.ts`, auth UI | **SET** |
| `VITE_SUPABASE_ANON_KEY` | Browser anon key | Client | **Required** (or publishable) | Auth UI | **SET** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser publishable key | Client | Optional alias | `src/config/env.ts` | **SET** |
| `VITE_SITE_URL` | Canonical site URL (SEO, OG) | Client | Recommended | Vite build, SEO script | **SET** (`https://muco-v1.vercel.app` for pre-cutover QA) |
| `VITE_APP_URL` | App origin label | Client | Optional | `src/config/env.ts` | Optional |
| `VITE_API_BASE_URL` | Cross-origin API | Client | Optional | API client | Empty = same-origin `/api` |
| `VITE_CONTACT_API_URL` | Lead form endpoint | Client | Optional | Contact forms | Default `/api/v1/leads` |
| `VITE_AUTH_REDIRECT_URL` | Auth email redirect (client) | Client | Recommended | Supabase Auth | **SET** |
| `AUTH_REDIRECT_URL` | Server invite / email fallback | Server | Recommended | `auth.service`, Resend templates | **SET** |
| `AUTH_INVITE_REDIRECT_URL` | Team invite reset path | Server | Optional | `auth.service` | Optional |
| `FOUNDER_BOOTSTRAP_SECRET` | One-time founder bootstrap | Server | Optional | `POST /api/v1/admin/bootstrap/founder` | **Operator-generated** |
| `AUTH_SECRET` | Reserved in `serverEnv` | Server | **Not used** in code paths today | — | Not required |
| `CORS_ORIGINS` | Cross-origin API | Server | Optional | v1 CORS middleware | Empty = same-origin only |
| `RAZORPAY_KEY_ID` | Razorpay orders (server); id may reach client for checkout | Server | Required for payments | `razorpay-order`, payments | **MISSING** — use **sandbox** from `muco-webpage-main` or Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay HMAC | Server | Required for payments | verify + webhooks | **MISSING** |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature | Server | Required for webhooks | `webhooks/razorpay` | **MISSING** |
| `RESEND_API_KEY` | Transactional email | Server | Optional | `server/lib/email/send.ts` | Optional |
| `RESEND_FROM_EMAIL` | From address | Server | Optional | Email send | Optional |
| `SUPABASE_STORAGE_BUCKET` | Customer/employee files | Server | Optional (default `customer-files`) | file services | **SET** — bucket must exist in Supabase |
| `NVIDIA_API_KEY` | LLM (Website/Solution Intelligence) | Server | Optional | `server/lib/ai/config.ts` | Optional — AI disabled if unset |
| `NVIDIA_API_BASE_URL` | NVIDIA API base | Server | Optional | AI config | Default set in code |
| `NVIDIA_MODEL` | Model id | Server | Optional | AI config | Default set in code |
| `NVIDIA_REQUEST_TIMEOUT_MS` | AI timeout | Server | Optional | AI config | Default 30s |
| `PAGESPEED_INSIGHTS_API_KEY` | PageSpeed in WI | Server | Optional | `performance-provider.ts` | Optional |
| `WI_*` | Crawler limits | Server | Optional | `crawler.ts` | Optional |
| `LEAD_RATE_LIMIT_*` | Public lead rate limit | Server | Optional | `rate-limit`, leads | Defaults in code |
| `AUTH_RATE_LIMIT_*` | Auth rate limit | Server | Optional | `auth` routes | Defaults in code |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics | Client | Optional | Analytics | Optional |
| `VITE_GSC_VERIFICATION` | Search Console | Client | Optional | `index.html` | Optional |
| `API_PORT` | Local API dev | Local only | N/A | `server/dev.ts` | Not on Vercel |
| `NODE_ENV` | Runtime mode | Server | Set by Vercel | Framework | Automatic |

**Never use:** `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_NVIDIA_API_KEY`, or any `VITE_*` server secret.

## Copy secrets (operator)

`vercel env pull` masks sensitive values for this CLI session. To finish muco-v1 Production:

1. Vercel → **mucolabs** → Settings → Environment Variables → Production → copy **DATABASE_URL** or **POSTGRES_URL** (and **SUPABASE_SERVICE_ROLE_KEY**, **SUPABASE_JWT_SECRET** if used) into **muco-v1** Production.
2. Or: **muco-v1** → Integrations → **Supabase** → link project `ltmaweunlnlpllrzzscq` (same as `mucolabs`).
3. Razorpay **test** keys: copy from **muco-webpage-main** Production into **muco-v1** Production (`RAZORPAY_*` only — this app does not use `VITE_RAZORPAY_KEY_ID` or `FORM_TOKEN_SECRET`).
4. Redeploy **muco-v1** production after changes.

## Database (Supabase `muco lab website`, ref `ltmaweunlnlpllrzzscq`)

- Schema: migrations **0000–0028** applied via Supabase MCP (47 public tables, `leads` present).
- `drizzle.__drizzle_migrations`: table exists, **0 rows** — do **not** run `npm run db:migrate` on this DB until journal is seeded or Drizzle will re-apply DDL. Coordinate with engineering before next schema change.
- **Storage:** no `customer-files` bucket yet — create private bucket in Supabase Storage before file QA.

## Supabase Auth (dashboard)

Add redirect URLs for pre-cutover QA:

- `https://muco-v1.vercel.app/**`
- `https://muco-v1.vercel.app/app/**` (and `/team`, `/admin` as needed)

Site URL can remain `https://mucolabs.com` until cutover; redirects must include muco-v1 host for testing.
