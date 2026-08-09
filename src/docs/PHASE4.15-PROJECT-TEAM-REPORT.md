# Phase 4.15 — Project Team & Resource Management

## Audit

- Reused `project_members` (composite PK `project_id` + `employee_id`, `role` text).
- Prior behavior: `POST /projects/:id/members` with silent `onConflictDoNothing`, minimal validation, no list/update/delete, basic team list on project detail.

## Architecture

- `server/lib/projects/project-member-roles.ts` — centralized role taxonomy and labels.
- `server/lib/projects/project-team.ts` — workload helpers, internal-role eligibility.
- `server/services/project-team.service.ts` — list (with workload), candidates, add, update role, remove with active-task guard, notifications, audit.

## APIs

- `GET /api/v1/admin/projects/:id/members`
- `GET /api/v1/admin/projects/:id/member-candidates`
- `POST /api/v1/admin/projects/:id/members` (enhanced)
- `PATCH /api/v1/admin/projects/:id/members/:memberId` (`memberId` = `employeeId`)
- `DELETE /api/v1/admin/projects/:id/members/:memberId`

## RBAC

- View: `projects.view`
- Manage: `projects.assign`

## Customer isolation

- No customer team APIs; customer project DTO unchanged.

## Limitations

- No `created_at` on `project_members` (assignment date not shown).
- No notification deduplication.
- Browser E2E not available.

## Readiness

**READY WITH LIMITATIONS**
