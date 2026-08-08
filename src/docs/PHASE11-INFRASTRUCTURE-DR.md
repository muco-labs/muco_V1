# Phase 11 — Infrastructure, backup & DR (documented)

## Current stack (as implemented)

| Provider | Purpose | Secrets |
|----------|---------|---------|
| Vercel | Hosting / API | Dashboard env vars |
| Supabase | Auth + Postgres | Service role server-only |
| Razorpay | Payments | Webhook + API keys server-only |
| Resend (if configured) | Email | API key server-only |

## Domain architecture (recommended)

| Host | Use |
|------|-----|
| mucolabs.com | Marketing |
| www | Redirect to apex |
| app.mucolabs.com | Portals (existing pattern) |
| api.* | Optional later; today `/api` on app host |

Do not create DNS records from this repo.

## Database

- Migrations through `0016_employee_org_operating.sql`
- RLS on customer + product tables
- **External:** verify Supabase backup retention, run restore drill

## DR targets (planning — not verified)

| Asset | RPO (target) | RTO (target) |
|-------|--------------|--------------|
| Database | Provider default | Hours (manual restore) |
| Website | Last deploy | Redeploy from git |
| Payments | Provider ledger | Reconcile via Razorpay dashboard |

## Business continuity

Document runbooks externally for: DB outage, payment webhook delay, email failure, auth outage, security incident.

## Cost management

No invented spend. Use provider billing dashboards; Executive view shows **revenue/invoices** from DB only.
