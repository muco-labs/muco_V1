# Netlify migration (Vercel → Netlify)

## Architecture

| Layer | Implementation |
|--------|----------------|
| Frontend | React 19 + Vite 8 SPA (`dist/`) |
| API | Hono app (`server/app.ts`) via Netlify Functions 2.0 (`netlify/functions/api.ts`, `path: /api/*`) |
| Auth / DB / Storage | **Supabase unchanged** (schema, RLS, Auth, Storage preserved) |
| Hosting config | `netlify.toml` (build, functions, redirects, headers) |
| Local API | Unchanged: `npm run dev:api` → `:8787`; Vite proxies `/api` |

## Removed Vercel dependencies

| Item | Classification | Notes |
|------|----------------|--------|
| `vercel.json` | REMOVE / REPLACE | Redirects, rewrites, headers → `netlify.toml` |
| `api/index.ts` | REPLACE | Vercel Node `{ fetch }` entry → `netlify/functions/api.ts` |
| Hosting on `*.vercel.app` | REPLACE | Netlify site + custom domains |
| `VERCEL_ENV` as sole SEO gate | ADAPT | Host-agnostic `DEPLOY_ENV` + Netlify `CONTEXT` (compat mirror kept) |

No `@vercel/*` runtime packages were in `package.json`. Optional peer mentions of `@vercel/postgres` in the lockfile remain transitive/unused.

## Migrated components

### API / functions

- Single catch-all Hono API preserved.
- Entry: `netlify/functions/api.ts` using `hono/netlify` + `@netlify/functions` `config.path = '/api/*'`.
- Routes under `/api` and `/api/v1/*` unchanged (frontend contracts unchanged).

### Redirects / rewrites

- Apex → www 301 preserved.
- SPA fallback `/* → /index.html` (200).
- `/api/*` served by Functions path config (no rewrite required).

### Headers

- Asset cache + security headers (HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy, CSP) moved to `netlify.toml`.
- CSP allowlists match prior production (Razorpay, GA, Supabase, Google Auth/Firebase frames).

### Cron / Blob / KV / Image Optimization

- **None** used in production Vercel config.
- Website Intelligence uses in-process work (pre-existing serverless caveat — unchanged).
- Images are static `/public` + CSS previews (no Vercel Image Optimization).

### SEO

- `resolveCanonicalSiteUrl` forces `https://www.mucolabs.com` when `DEPLOY_ENV`/`CONTEXT`/`VERCEL_ENV` resolve to **production**.
- Preview may still use `VITE_SITE_URL` for QA hosts.

## Supabase

**No database or data migration.**  
Preserve existing project URL, anon key, service role (server-only), Auth redirect URLs, Storage bucket, and RLS.

Update Supabase Auth **Redirect URLs** / **Site URL** to include the Netlify production and preview origins once the site URL is known.

## Environment variables (NAMES only)

### Public / build (`VITE_*` + deploy)

- `VITE_SITE_URL`
- `VITE_APP_URL`
- `VITE_API_BASE_URL` (optional)
- `VITE_CONTACT_API_URL` (optional)
- `VITE_GA_MEASUREMENT_ID` (optional)
- `VITE_GSC_VERIFICATION` (optional)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (JWT anon for browser auth)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (optional)
- `VITE_AUTH_REDIRECT_URL` (optional)
- `VITE_FIREBASE_*` (optional)
- `VITE_PORTAL_ORIGIN_*` (optional)
- `DEPLOY_ENV` (set `production` on Production context)

### Server-only

- `DATABASE_URL` (and optional `POSTGRES_URL` / `POSTGRES_PRISMA_URL`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `AUTH_REDIRECT_URL` / `AUTH_INVITE_REDIRECT_URL`
- `FOUNDER_BOOTSTRAP_SECRET`
- `AUTH_SECRET` (optional)
- `CORS_ORIGINS`
- `LEAD_RATE_LIMIT_*` / `AUTH_RATE_LIMIT_*`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
- `NVIDIA_*` / `PAGESPEED_INSIGHTS_API_KEY` / `WI_*` (optional)

Never put server secrets in `VITE_*`.

## Netlify configuration

See `netlify.toml`:

- Build: `npm run build`
- Publish: `dist`
- Functions: `netlify/functions`
- Node 20
- Production `DEPLOY_ENV=production`

## Deployment checklist (dashboard)

1. Create/link Netlify site to `muco-labs/muco_V1` (`main`).
2. Confirm build settings honor `netlify.toml`.
3. Paste Production env vars (names above).
4. Add custom domains `mucolabs.com` + `www.mucolabs.com`.
5. Update Supabase Auth redirect allowlist for www + Netlify deploy URLs.
6. Point Razorpay webhook to `https://www.mucolabs.com/api/v1/webhooks/razorpay`.
7. Run `DATABASE_URL=… npm run db:migrate` against production (no reset).
8. Smoke-test: `/`, `/api/health`, sign-in, start-project, webhook.

## Post-deploy smoke tests

- [ ] `GET /api/health` → `{ success: true, … }`
- [ ] Homepage + major marketing routes render
- [ ] `robots.txt` / `sitemap.xml` use `https://www.mucolabs.com`
- [ ] Auth sign-in / session / protected portal route
- [ ] Lead form `POST /api/v1/leads`
- [ ] Security headers present (HSTS, CSP)
- [ ] Apex redirects to www

## Local development

```bash
npm install
npm run dev:api   # :8787
npm run dev       # Vite :5173, proxies /api → :8787
```

Optional: `npx netlify dev` after Netlify CLI login to emulate Functions + redirects.
