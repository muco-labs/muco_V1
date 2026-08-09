# Phase 4.19 — Freelancer Availability & Capacity Foundation

## Readiness

**READY WITH LIMITATIONS** — `301` tests pass with `npx vitest run --pool=threads --maxWorkers=2`; `npm run build` and `npm run lint` pass. Browser E2E harness: **not present**. Manual browser verification: **not performed** in this session (no local dev login exercised).

---

## 1. Audit

| Area | Reuse |
|------|--------|
| `freelancer_profiles` | `availability_status`, `availability_note`; extended enum + `availability_updated_at` |
| Portal | Existing freelancer routes, dashboard, nav (`/availability`) |
| Assignments | `project_freelancers`, `tasks.assigned_freelancer_id` (4.17) |
| Workload | `project-team.ts` task rules + project terminal status |
| Offerings | Phase 4.18 services/skills unchanged |
| RBAC | `freelancers.view` / `freelancers.manage`, `projects.assign`, `tasks.update` |
| Notifications | No broadcast on self-service availability change; task assign unchanged |
| Customer | No DTO changes |

No separate availability history table.

## 2. Architecture decision

- **Availability** stays on `freelancer_profiles`: `available` \| `limited` \| `unavailable`, optional `availability_note`, `availability_updated_at`.
- **Workload** is computed server-side from assigned tasks and active project memberships only—no invented capacity % or hours.
- **Eligibility** for *new* assignments: approved + linked + `isFreelancerOpenForNewAssignments` (`available` or `limited`). Existing `project_freelancers` and task rows are never removed when status becomes `unavailable`.

## 3. Availability model

- Freelancer self-service: `PATCH /api/v1/freelancer/availability` (verified + approved).
- Admin may set via existing admin patch (`freelancers.manage`) → audit `freelancer.availability_admin_updated`.
- Self-service audit: `freelancer.availability_updated`.

## 4. Workload rules

- **Active project**: freelancer on project where project status is not terminal.
- **Active task**: assigned to freelancer, status not `done` / `cancelled`.
- **Overdue**: active task with `dueDate` before server now.
- **Blocked**: active task with status `blocked`.
- Milestones are not counted as freelancer workload.

## 5. API changes

**Freelancer**

- `GET /api/v1/freelancer/availability`
- `PATCH /api/v1/freelancer/availability`
- `GET /api/v1/freelancer/workload`
- `GET /api/v1/freelancer/dashboard` — includes `availability` + `workload`

**Admin**

- `GET /api/v1/admin/freelancers/:id/workload`

**Enriched (existing)**

- Admin project freelancer list/candidates: availability labels + per-project task counts (incl. blocked).
- New project freelancer assign + new/changed freelancer task assign: rejects `unavailable` with API error.

## 6. Security / RBAC

- Freelancer: own availability and workload only (`requireFreelancerContext`).
- Admin view/manage per existing permissions.
- Customers: no availability/workload in customer APIs (covered by existing isolation tests).

## 7. UX

- Freelancer dashboard: availability summary + workload counts + assigned projects.
- Freelancer availability page: radio status (incl. limited), optional note, save + `aria-live` feedback.
- Admin freelancer list/detail: availability label; detail workload section; services/skills (4.18).
- Admin project freelancers: availability on members and candidate dropdown.

## 8. Database

- `server/db/migrations/0028_freelancer_availability_capacity.sql` — enum value `limited`, column `availability_updated_at`.
- `server/db/schema.ts` — Drizzle enum + column.

## 9. Tests

- `server/lib/freelancers/freelancer-availability.test.ts` — enum validation, limited vs unavailable, workload counts, terminal tasks.
- `server/lib/freelancers/project-freelancer-assignment.test.ts` — limited eligibility, `blockedTaskCount` on workload helper.
- Existing customer DTO / RBAC tests retained.

**Count:** 301 tests (54 files) with stable Vitest pool.

## 10. Build / lint

- `npm run build` — **pass**
- `npm run lint` (oxlint) — **pass** (pre-existing warnings in `AuthProvider.tsx`, validation regex files only)

## 11. Browser / manual verification

- **Automated:** unit tests only.
- **Manual browser:** not run (no E2E harness; dev server/login not exercised in this pass).

Recommended manual checklist: freelancer availability save → dashboard counts → admin detail workload → assign limited freelancer → reject unavailable on new project/task assign → customer project view unchanged.

## 12. Regression

Phases 4.16–4.18, employee team/tasks, customer portal, CRM, proposals, payments, messaging, files, careers, Start Project — no intentional removals; scope limited to availability/workload/eligibility.

## 13. Limitations

- Admin freelancer **list** does not batch workload counts (detail uses `GET .../workload`).
- No calendar, hours, utilization %, matching, or notifications on availability self-update.
- IDOR/integration coverage remains service-layer + unit tests (no full DB E2E).

## 14. Intentionally not implemented

Marketplace, public profiles, auto-matching/assignment, booking, payouts, wallet, ratings, messaging channels, fake seed data, production deploy.

## 15. Readiness status

**READY WITH LIMITATIONS** — complete for Phase 4.19 scope pending manual QA and applying migration `0028` on target databases.
