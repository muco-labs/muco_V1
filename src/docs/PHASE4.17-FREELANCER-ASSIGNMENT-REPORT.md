# Phase 4.17 — Freelancer Assignment & Project Resource Allocation

## Readiness

**READY WITH LIMITATIONS** — `npm run build` and `npm run lint` pass; `npx vitest run --pool=threads --maxWorkers=2` reports **52 files / 280 tests** passed. Default `npm test` may hit a Vitest worker memory limit on some machines (environmental). Browser E2E: **N/A** (not configured).

---

## 1. Implemented

- **`project_freelancers`** table: project-scoped freelancer assignment with normalized project role (reuses `PROJECT_MEMBER_ROLES`).
- **`tasks.assigned_freelancer_id`**: optional freelancer assignee; mutually exclusive with employee assignee on create/update.
- **Admin APIs**: list/assign/update role/remove project freelancers; searchable candidate list (eligible only).
- **Admin UI**: Team section split into **Employees** + **Freelancers**; task assignee picker supports employees and project freelancers.
- **Freelancer APIs**: assigned projects, project detail, assigned tasks, PATCH own task status (lifecycle rules).
- **Freelancer portal**: dashboard assigned work, My projects, project detail, Assigned tasks.
- **Notifications** on project assign, role change, removal, task assign.
- **Audit**: `freelancer.project_assigned`, `freelancer.project_role_changed`, `freelancer.project_removed`, `freelancer.task_assigned`, `freelancer.task_status_changed`.

## 2. Architecture reused

- `project_members` unchanged for employees.
- `project-team.service.ts` / `AdminProjectTeamSection` unchanged in behavior.
- `project-tasks.service.ts` extended (not duplicated).
- Phase 4.16 `freelancer_profiles`, `requireFreelancerContext`, verification/approval rules.
- `normalizeProjectMemberRole` / shared role labels.
- Existing notifications and `audit_logs` patterns.

## 3. Database

- Migration: `server/db/migrations/0026_project_freelancers.sql`
- **Why separate table**: `project_members` PK/FK is employee-only; mixing would break employee flows and FK integrity.

## 4. API changes

**Admin** (`/api/v1/admin`):

- `GET /projects/:id/freelancers`
- `GET /projects/:id/freelancer-candidates?q=`
- `POST /projects/:id/freelancers` `{ freelancerId, role }`
- `PATCH /projects/:id/freelancers/:freelancerId` `{ role }`
- `DELETE /projects/:id/freelancers/:freelancerId`
- Project task create/update schemas: optional `assignedFreelancerId`

**Freelancer** (`/api/v1/freelancer`):

- `GET /projects`, `GET /projects/:id`
- `GET /tasks?projectId=`, `GET /tasks/:taskId`
- `PATCH /tasks/:taskId` `{ status }` (todo | in_progress | blocked | done)
- Dashboard includes `projects` summary

Customer APIs: **no freelancer fields added**.

## 5. Admin UX

- Project detail → Team → Employees (existing) + Freelancers (badge, professional role, workload, assign/search/candidates, role, remove with confirmation).

## 6. Freelancer UX

- Dashboard: assigned projects list.
- Nav: My projects, Tasks, Profile, Availability.
- Project detail: safe project metadata + own tasks + status updates.

## 7. Security checks

- `requireFreelancerContext` + explicit `project_freelancers` row for project/task access (404 on IDOR).
- Task updates only when `assigned_freelancer_id` matches and project not terminal.
- Assignment eligibility: verified + approved + linked user + FREELANCER role + not CUSTOMER + available + open to projects.
- No global `projects.assign` / `tasks.assign` for FREELANCER role.

## 8. RBAC

- No new global freelancer permissions; admin retains `projects.assign` / task permissions.
- `FREELANCER` role permissions array remains empty; access is resource-scoped in services.

## 9. Notifications

- `freelancer.project_assigned`, `freelancer.project_role_changed`, `freelancer.project_removed`, `freelancer.task_assigned` (in-app only; no email/WhatsApp).

## 10. Audit events

Listed in §1; metadata limited to ids/role/status (no internal notes or customer secrets).

## 11. Tests added

- `server/lib/freelancers/project-freelancer-assignment.test.ts` — eligibility, workload, DTO shape, customer isolation, RBAC.

## 12. Total tests

**280** (with `--pool=threads --maxWorkers=2`).

## 13. Build

**Pass** (`npm run build`).

## 14. Lint

**Pass** (`npm run lint`; pre-existing warnings only).

## 15. Browser E2E

**N/A**.

## 16. Limitations

- No integration tests against live DB for full IDOR matrix (covered by unit tests + service-layer checks).
- Freelancer cannot create tasks or self-assign; admin must assign tasks.
- Candidate list does not show fabricated workload/availability beyond Phase 4.16 fields.
- `npm test` default pool may OOM on low-memory hosts; use thread pool with fewer workers if needed.

## 17. Explicitly NOT implemented

Marketplace, public profiles, customer-visible freelancers, wallet/payouts/earnings, ratings, auto-assign, email/WhatsApp automation, time tracking, deployment.

## 18. Key files

- `server/services/project-freelancer-assignment.service.ts`
- `server/services/freelancer-delivery.service.ts`
- `src/components/portal/AdminProjectFreelancersSection.tsx`
- `src/pages/portal/freelancer/FreelancerPortalPages.tsx`
