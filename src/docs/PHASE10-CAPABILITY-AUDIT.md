# Phase 10 — MUCO capability audit

Audit date: validation phase (no external SaaS revenue claimed).

## Reusable platform capabilities

| Area | Current state | Product reuse notes |
|------|---------------|---------------------|
| Authentication | Supabase Auth + `users` row linkage | Reuse for product sign-in; no new OAuth in Phase 10 |
| Authorization | RBAC roles/permissions, portal guards | Extend with product org roles separate from MUCO delivery roles |
| Database | PostgreSQL + Drizzle, migrations 0000–0015 | Add product tables without overloading `customer_profiles` |
| RLS | Enabled on delivery portal tables + new product org tables | Defense in depth; API remains source of truth |
| Admin | Full operations CRM, sales, revenue | Product waitlist admin under `settings.manage` |
| Customer accounts | `customer_profiles` + customer portal | Pattern for Client Hub end-users; not the same tenant model |
| Employee accounts | Employee portal + tasks/projects | Delivery team pattern; product may mirror for agency teams later |
| CRM | Leads, pipeline, follow-ups, geo segments | Distribution + validation interviews; not the SaaS core |
| Projects / tasks | Workflow templates, milestones | Core domain logic to productize for Client Hub MVP |
| Payments | Razorpay webhooks, invoices | Reuse patterns when billing is validated |
| Notifications / email | Transactional email helpers | Product lifecycle email later |
| Support | Tickets with tenant customer scope | Map to per-organization support in MVP |
| Analytics | GA4 event constants | Separate marketing vs product events |
| File storage | Files table + customer scoping | Needs product org scoping in MVP |
| API | Hono `/api/v1`, rate limits, Zod validation | Add `/product/*` public endpoints carefully |
| Security | Rate limits, honeypots, permission middleware | Extend to waitlist + future AI routes |
| Audit logs | `audit_logs` | Use for product admin actions in MVP |

## Gaps for SaaS

- No standalone **product billing** or subscription state machine yet
- No **AI provider** integration (by design until product scope needs it)
- **Multi-tenant product org** tables added in 0015 but no signup flow wired
- **Usage metering** not implemented

## Principles

- Do not merge MUCO delivery customers with SaaS tenants in one table
- Do not break existing admin/customer/employee portals
- Product validation precedes full MVP build
