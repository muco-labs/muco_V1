# MUCO LABS — Production deployment (Step 14)

## Infrastructure map (pre-deploy audit)

| Layer | Technology |
|--------|------------|
| Framework | React 19 + Vite 8 (SPA) |
| API | Hono on Vercel Serverless (`api/index.ts`, Node runtime) |
| Package manager | npm |
| Node | `>=20` (Vercel project may use 24.x) |
| Build | `npm run build` → SEO script, `tsc`, Vite → `dist/` |
| Database | PostgreSQL via `DATABASE_URL` (Drizzle migrations in `server/db/migrations/`) |
| Auth | Supabase Auth (browser: `VITE_SUPABASE_*`; server: service role + JWT) |
| Storage | Supabase Storage bucket (`SUPABASE_STORAGE_BUCKET`) |
| Payments | Razorpay server-side orders + verify + webhook |
| Email | Resend (optional, `RESEND_API_KEY`) |
| Hosting | Single Vercel project (`muco-v1`) connected to GitHub `muco-labs/muco_V1` `main` |

### URL architecture (recommended)

One Vercel deployment serves everything on the apex domain:

- `https://mucolabs.com` — marketing site
- `https://mucolabs.com/app/*` — customer portal
- `https://mucolabs.com/team/*` — employee portal
- `https://mucolabs.com/admin/*` — admin portal
- `https://mucolabs.com/api/*` — API (same origin; no separate `api.` subdomain required)

Optional future subdomains (`app.`, `team.`, `admin.`) only need DNS + `CORS_ORIGINS` if you split origins. Do not create extra Vercel projects unless you have a clear need.

### API routes (high level)

- `GET /api/health` — safe status + database connectivity flag
- `POST /api/v1/leads` — public inquiry (rate limited, honeypot)
- `/api/v1/auth/*` — registration / profile (rate limited)
- `/api/v1/customer/*`, `/api/v1/employee/*`, `/api/v1/admin/*` — authenticated portals
- `POST /api/v1/webhooks/razorpay` — signature-verified, idempotent payment events

## Git → Vercel

1. Push to `main` on GitHub (`muco-labs/muco_V1`).
2. Vercel auto-builds with framework **Vite**, output `dist`, API from `/api`.
3. Rollback: Vercel dashboard → Deployments → promote previous **production** deployment (do not delete history).

## Environment variables

See `.env.example`. Classification:

| Variable | Class | Notes |
|----------|--------|--------|
| `VITE_SITE_URL`, `VITE_APP_URL`, `VITE_*` analytics/SEO | **PUBLIC** | Bundled in client |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | **PUBLIC** | Anon/publishable key only |
| `DATABASE_URL` | **SECRET** | Server only |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | **SECRET** | Server only |
| `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **SECRET** | Server only |
| `RESEND_API_KEY` | **SECRET** | Server only |
| `FOUNDER_BOOTSTRAP_SECRET` | **SECRET** | Server only |
| `RAZORPAY_KEY_ID` | **SERVER** | Used server-side; only **key id** may be returned to client for checkout |
| `CORS_ORIGINS` | **SERVER** | Comma-separated; leave empty for same-origin-only |

Set **Production**, **Preview**, and **Development** separately in Vercel. Use non-production Razorpay keys and databases for preview/local when possible.

## Database migrations

```bash
# Against target DATABASE_URL (Supabase pooler or direct Postgres)
npm run db:migrate
```

Do **not** reset production. Migrations are additive through `0007_business_workflow.sql` and RLS in `0002_row_level_security.sql`.

Supabase dashboard “migrations” may be empty if you apply Drizzle SQL outside Supabase CLI — that is expected when using `npm run db:migrate`.

## Razorpay production

1. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (live keys in production only).
2. Webhook URL: `https://<your-production-host>/api/v1/webhooks/razorpay`
3. Set `RAZORPAY_WEBHOOK_SECRET` from Razorpay dashboard.
4. Enable events: **`payment.captured`**, **`payment.failed`** (others only if implemented).
5. Never mark paid from browser callbacks alone — use verify + webhook + `finalizeSuccessfulPayment`.

## Resend / email

1. Verify sending domain in Resend.
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
3. Configure **SPF / DKIM / DMARC** in GoDaddy (or DNS host) per Resend docs — **do not remove existing MX/SPF/DKIM** for company mail.

## GoDaddy DNS (safety checklist)

Before changing DNS, export current records.

| Record type | Typical action |
|-------------|----------------|
| **MX** | **DO NOT TOUCH** unless migrating email |
| **SPF/DKIM/DMARC TXT** | **KEEP**; add Resend records alongside, do not replace |
| **A / CNAME @ and www** | **CHANGE** only to Vercel-provided values from Project → Domains |
| **Verification TXT** | **KEEP** unless provider says to replace |

Use exact host/target values from **Vercel → Project → Settings → Domains** (not hard-coded in this repo).

### Custom domain status

Connect `mucolabs.com` and `www.mucolabs.com` in Vercel. Until assigned, traffic may hit a different host (health response format may differ from this codebase’s `{ success, data }` API).

## CORS

Default: `CORS_ORIGINS` unset → API CORS middleware disabled → browsers call `/api` same-origin only.

If you add subdomains later:

```env
CORS_ORIGINS=https://mucolabs.com,https://www.mucolabs.com,https://app.mucolabs.com
```

Never use `*` for authenticated APIs.

## Security headers

Configured in `vercel.json` (aligned with `src/config/security.ts`): HSTS, frame denial, CSP, referrer policy. After CSP changes, test auth (Supabase), analytics, and fonts.

## Backups

Not configured in-repo. Enable **Supabase** (or Postgres provider) automated backups + document restore drill. See `server/docs/OPERATIONS.md`.

## Production gate checklist

- [ ] `npm run build` and `npm run test` pass
- [ ] `DATABASE_URL` + `npm run db:migrate` on production
- [ ] Supabase Auth redirect URLs include production origins
- [ ] Vercel env vars set (no secrets in `VITE_*`)
- [ ] Razorpay webhook live + secret set
- [ ] Resend domain verified (if using email)
- [ ] Custom domains assigned on Vercel project
- [ ] Portal routes return `noindex` (already in layouts)
- [ ] Cross-role denial tested manually

## OAuth / SMS

GitHub, GitLab, Google, and mobile OTP are **not** required for this architecture unless already configured in Supabase. Do not enable extra providers in Step 14 without explicit need.
