# Phase 11 — Operating model audit

## Control matrix (current codebase)

| Surface | Who | Enforcement |
|---------|-----|-------------|
| Public website | Anonymous / leads | Rate limits, validation |
| Customer portal | `CUSTOMER` role + permissions | Portal guard + customer.service scoping |
| Employee portal | `EMPLOYEE`+ roles | Portal guard + project membership |
| Admin / CRM | `ADMIN`, `SUPER_ADMIN`, `FOUNDER` + permissions | `requirePermission` on each route |
| Product waitlist | Public | Rate limit; admin `settings.manage` |
| Product tenants (future) | Product org members | RLS + API (Phase 10) |

## Founder-controlled (by design)

- Founder account status changes (only Founder can modify Founder)
- Proposal approval / discount (financial roles)
- Bootstrap secret / integration secrets (env only)
- Executive overview (Founder / Super Admin or `analytics.view` + `settings.manage`)

## What was added in Phase 11

- Employee `employment_state`, `manager_employee_id`, validated `department` slugs
- `GET /api/v1/admin/executive/overview` — **actual vs pipeline** labels
- `GET /api/v1/admin/employees/access-review`
- `PATCH /api/v1/admin/employees/:id/org`
- Offboarding hook: disabling user sets employment `offboarded` + audit `employee.offboarded`

## Not duplicated

- Existing RBAC (`roles`, `permissions`, `role_permissions`) — job function bundles documented in `server/lib/org/job-permission-profiles.ts` only
