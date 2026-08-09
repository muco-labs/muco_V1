# Phase 4.14 — Project Tasks, Team Workspace & Delivery Operations

## Task audit

- Reused existing `tasks` table (`projectId`, `milestoneId`, `assignedEmployeeId`, `title`, `description`, `status`, `priority`, `dueDate`, timestamps).
- Status values: `todo`, `in_progress`, `blocked`, `done`; migration `0024_task_status_cancelled.sql` adds `cancelled`.
- Global admin task APIs (`GET/POST /tasks`, `PATCH /tasks/:id`) and employee `/team/tasks` retained.
- `project_members` used for assignee validation; customers never assigned.
- Gap filled: project-scoped admin APIs, delivery progress from tasks, admin project Tasks workspace.

## Architecture

- `server/lib/projects/task-delivery.ts` — transitions, overdue, milestone task %, admin DTO, `TASK-XXXXXXXX` references.
- `server/services/project-tasks.service.ts` — list/create/update/complete/cancel with validation, audit, in-app notifications.
- `getProjectDeliveryAdminExtras` dynamically imports task enrichment to avoid circular deps.
- No second task table; no customer task APIs.

## Task lifecycle

- Transitions enforced via `canTransitionTaskStatus`; terminal `done` / `cancelled` cannot reopen without new flow.
- Completed/cancelled **projects** block task mutations.
- DB completion status remains `done` (labeled “Completed” in UI).

## Milestone relationship

- Tasks belong to one project; optional `milestoneId` validated server-side against `milestones.projectId`.

## Assignment

- Assignees must exist in `project_members` for the project; arbitrary user IDs rejected.

## Permissions

- Reused `tasks.view`, `tasks.create`, `tasks.update` plus `projects.view` / `projects.update` on project-scoped routes.
- Customers: no task permissions; customer project DTOs unchanged (milestones/progress only).

## APIs (new)

- `GET/POST /api/v1/admin/projects/:id/tasks`
- `GET/PATCH /api/v1/admin/projects/:id/tasks/:taskId`
- `POST .../complete`, `POST .../cancel`
- Query filters: `status`, `priority`, `milestoneId`, `assigneeEmployeeId`, `overdueOnly`

## Admin UX

- `AdminProjectTasksSection` on `/admin/projects/:id` (after Milestones): filters, create form, status/assignee, complete/cancel, overdue label.
- Milestone cards show task counts and task-based % when tasks exist.

## Customer UX

- No internal task board; no task IDs/titles/assignees in customer APIs.

## Notifications

- In-app only: `task.assigned`, `task.blocked` to assignee’s user account.
- No email/WhatsApp/cron; no deduplication layer (not present platform-wide).

## Audit

- `task.created`, `task.updated`, `task.assigned`, `task.status_changed`, `task.completed`, `task.cancelled` via existing `audit_logs`.

## Security

- IDOR prevented by `projectId` + `taskId` join; cross-project milestone/assignee rejected; terminal project guard.

## Tests

- `server/lib/projects/task-delivery.test.ts` — transitions, overdue, progress, DTO/RBAC concepts.

## Build / lint / E2E

- `npm test`: 248 passed.
- `npm run build`: passed.
- `npm run lint`: passed (pre-existing warnings only).
- Browser E2E: not available.

## Limitations

- No task file attachments; no Kanban/Gantt; no global task product; notification deduplication not implemented.
- Project progress blends milestone task averages only when milestones have tasks; zero-task milestones do not fabricate %.

## Excluded scope

Per Phase 4.14 spec (customer task board, AI PM, reminders, payroll, etc.).

## Readiness

**READY WITH LIMITATIONS** (E2E unavailable; notifications basic).
