# MUCO LABS — Server operations (Step 7 foundation)

## Database technology

**PostgreSQL** with **Drizzle ORM** and SQL migrations (`server/db/migrations/`).

| Factor | Fit |
|--------|-----|
| Hosting | Vercel serverless API + managed Postgres (Neon, Supabase, Vercel Postgres, RDS, etc.) |
| Domain | CRM, projects, invoices, payments, RBAC — strongly relational |
| Integrity | Foreign keys, transactions, unique constraints (e.g. user email, invoice number) |
| Evolution | Versioned migrations via `drizzle-kit` + `npm run db:migrate` |
| Security | Connection string is **server-only** (`DATABASE_URL`, never `VITE_*`) |

## Migrations

```bash
# After schema changes in server/db/schema.ts
npm run db:generate
npm run db:migrate   # requires DATABASE_URL
```

Development-only seed (roles/permissions scaffolding, no fake customers):

```bash
npm run db:seed      # NODE_ENV=development recommended
```

## Backups (not configured in this repo)

Automated backups are **not** provisioned by Step 7. For production:

| Item | Recommendation |
|------|----------------|
| Frequency | Daily full backup minimum; point-in-time recovery (PITR) if the provider supports it |
| Retention | 30–90 days per compliance needs; longer for audit-heavy tables if required |
| Restore | Document provider restore steps; run a quarterly restore drill on a non-production instance |
| DR | Keep `DATABASE_URL` and migration history in sync; redeploy API from git; restore DB from backup |

Configure backups in your **Postgres provider** console (Neon branches, Supabase backups, etc.). Do not store backup credentials in the frontend or in `VITE_*` variables.

## Health check

`GET /api/health` returns `{ success: true, data: { status: "ok" | "degraded", database: "connected" | "unconfigured" | "unavailable" } }` without exposing secrets. `unavailable` uses HTTP 503.

## Rate limiting

Lead intake uses in-memory rate limiting per instance (`server/middleware/rate-limit.ts`). For production at scale, replace with a shared store (e.g. Upstash Redis) keyed by client IP.
