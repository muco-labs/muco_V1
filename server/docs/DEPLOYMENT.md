# MUCO LABS — Production deployment

## Infrastructure map

| Layer | Technology |
|--------|------------|
| Framework | React 19 + Vite 8 (SPA) |
| API | Hono on Netlify Functions (`netlify/functions/api.ts`, Node) |
| Package manager | npm |
| Node | `>=20` (`NODE_VERSION=20` in `netlify.toml`) |
| Build | `npm run build` → SEO script, `tsc`, Vite → `dist/` |
| Database | PostgreSQL via `DATABASE_URL` (Drizzle migrations in `server/db/migrations/`) |
| Auth | Supabase Auth (browser: `VITE_SUPABASE_*`; server: service role + JWT) |
| Storage | Supabase Storage bucket (`SUPABASE_STORAGE_BUCKET`) |
| Payments | Razorpay server-side orders + verify + webhook |
| Email | Resend (optional, `RESEND_API_KEY`) |
| Hosting | Netlify (`netlify.toml` + `NETLIFY_MIGRATION.md`) |

### URL architecture

One Netlify site serves marketing + portals:

- `https://www.mucolabs.com` — marketing site
- `https://www.mucolabs.com/app/*` — customer portal (path mode)
- `https://www.mucolabs.com/api/*` — API (same origin via Netlify Function)

Apex `mucolabs.com` → `www.mucolabs.com` (301 in `netlify.toml`). Optional portal subdomains need DNS + Netlify domain attach on the **same** site + `CORS_ORIGINS` if browsers call `/api` cross-origin.

### API routes (high level)

- `GET /api/health` — safe status + database connectivity flag
- `POST /api/v1/leads` — public inquiry (rate limited, honeypot)
- `/api/v1/auth/*` — registration / profile (rate limited)
- `/api/v1/customer/*`, `/api/v1/employee/*`, `/api/v1/admin/*` — authenticated portals
- `POST /api/v1/webhooks/razorpay` — signature-verified, idempotent payment events

## Git → Netlify

1. Push to `main` on GitHub (`muco-labs/muco_V1`).
2. Netlify auto-builds using `netlify.toml` (Vite → `dist`, API from `netlify/functions`).
3. Rollback: Netlify dashboard → Deploys → publish a previous production deploy.

## Environment variables

See `.env.example` and `NETLIFY_MIGRATION.md`. Classification:

| Variable | Class | Notes |
|----------|--------|--------|
| `VITE_SITE_URL`, `VITE_APP_URL`, `VITE_*` analytics/SEO | **PUBLIC** | Bundled in client |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` / publishable | **PUBLIC** | Anon/publishable key only |
| `DATABASE_URL` | **SECRET** | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** | Server only |
| `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **SECRET** | Server only |
| `RESEND_API_KEY` | **SECRET** | Server only |
| `FOUNDER_BOOTSTRAP_SECRET` | **SECRET** | Server only |
| `RAZORPAY_KEY_ID` | **SERVER** | Used server-side; only **key id** may be returned to client for checkout |
| `CORS_ORIGINS` | **SERVER** | Comma-separated; leave empty for same-origin-only |
| `DEPLOY_ENV` | **BUILD** | `production` on Netlify production context |

Set **Production** and **Deploy Previews** separately in Netlify. Use non-production Razorpay keys and databases for preview/local when possible.

## Database migrations

```bash
# Against target DATABASE_URL (Supabase pooler or direct Postgres)
npm run db:migrate
```

Do **not** reset production. Migrations are additive (journal `server/db/migrations/meta/_journal.json`).

## Razorpay production

1. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (live keys in production only).
2. Webhook URL: `https://www.mucolabs.com/api/v1/webhooks/razorpay`
3. Set `RAZORPAY_WEBHOOK_SECRET` from Razorpay dashboard.
4. Enable events: **`payment.captured`**, **`payment.failed`** (others only if implemented).
5. Never mark paid from browser callbacks alone — use verify + webhook + `finalizeSuccessfulPayment`.

## Resend / email

1. Verify sending domain in Resend.
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
3. Configure **SPF / DKIM / DMARC** in DNS per Resend docs — **do not remove existing MX/SPF/DKIM** for company mail.

## DNS (safety checklist)

Before changing DNS, export current records.

| Record type | Typical action |
|-------------|----------------|
| **MX** | **DO NOT TOUCH** unless migrating email |
| **SPF/DKIM/DMARC TXT** | **KEEP**; add Resend records alongside |
| **A / CNAME @ and www** | **CHANGE** only to Netlify-provided values from Domain management |
| **Verification TXT** | **KEEP** unless provider says to replace |

Use exact host/target values from **Netlify → Domain management**.

## CORS

Default: `CORS_ORIGINS` unset → API CORS middleware disabled → browsers call `/api` same-origin only.

If you add subdomains later:

```env
CORS_ORIGINS=https://mucolabs.com,https://www.mucolabs.com,https://app.mucolabs.com
```

Never use `*` for authenticated APIs.

## Security headers

Configured in `netlify.toml` (aligned with `src/config/security.ts`): HSTS, frame denial, CSP, referrer policy. After CSP changes, test auth (Supabase), analytics, and fonts.

## Backups

Not configured in-repo. Enable **Supabase** (or Postgres provider) automated backups + document restore drill. See `server/docs/OPERATIONS.md`.

## Production gate checklist

- [ ] `npm run build` and `npm run test` pass
- [ ] `DATABASE_URL` + `npm run db:migrate` on production
- [ ] Supabase Auth redirect URLs include production Netlify / www origins
- [ ] Netlify env vars set (no secrets in `VITE_*`)
- [ ] Razorpay webhook live + secret set
- [ ] Resend domain verified (if using email)
- [ ] Custom domains assigned on Netlify site
- [ ] Portal routes return `noindex` (already in layouts)
- [ ] Cross-role denial tested manually

## OAuth / SMS

GitHub, GitLab, Google, and mobile OTP are **not** required for this architecture unless already configured in Supabase. Do not enable extra providers without explicit need.
