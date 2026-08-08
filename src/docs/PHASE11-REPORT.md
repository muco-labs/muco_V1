# Phase 11 — Scale & operating system report

## Summary

Phase 11 adds **corporate operating-system architecture** without fake org data: employee org fields, executive dashboard (real metrics, actual vs pipeline), team access review, offboarding audit hook, department/job permission reference docs, and SOP/knowledge/policy **frameworks**.

## Migration

- `0016_employee_org_operating.sql` — `employment_state`, `manager_employee_id`

Run `npm run db:migrate` on deployed environments.

## Admin UI

- `/admin/executive` — leadership overview
- `/admin/team/access` — permissions review
- Employees invite: department + job title

## APIs

- `GET /api/v1/admin/executive/overview`
- `GET /api/v1/admin/employees/access-review`
- `PATCH /api/v1/admin/employees/:employeeId/org`

## Validation

`npm run lint`, `npm test`, `npm run build`

## Stop

No new SaaS products, ads, or office entities in this phase.

## Founder decisions required

1. Remote vs hybrid vs physical office (external)
2. First hire priorities (`PHASE11-ORG-STRUCTURE.md` hiring section)
3. Legal policies and employment compliance (external counsel)
4. Backup/DR drill schedule with Supabase/Vercel
5. Whether to add `MANAGER` role later vs permission-only leads

## External actions

- Verify database backup restore
- Vendor billing ownership spreadsheet
- Validation interviews for Client Hub (carry-over from Phase 10)
