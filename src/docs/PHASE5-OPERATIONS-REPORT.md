# Phase 5 — Business automation report

See `PHASE5-OPERATIONS-AUDIT.md` for the baseline audit.

## Lifecycle

Lead → CRM statuses → proposal (draft/sent/accepted) → customer → project → milestones/tasks → invoice → Razorpay payment → support. Each transition logs to `audit_logs` where implemented.

## Key APIs

- `POST /api/v1/admin/proposals/:id/create-project` — accepted proposals only
- `POST /api/v1/admin/projects/:id/apply-template` — `{ templateId: "website" | "software" }`
- `POST /api/v1/admin/projects/:id/complete` — requires no open tasks
- `GET /api/v1/admin/operations/report` — founder/management metrics
- `GET /api/v1/admin/audit-logs/automation` — payments + automation actions

## Security

Server-side permissions unchanged (`projects.update`, `audit_logs.view`, etc.). No new public endpoints.

## External setup

- Resend: `project_started` template added alongside existing transactional emails
- No new migrations in Phase 5
- Scheduled reminders: use CRM follow-up fields; background jobs not added (document for future worker)

## Validation

Run `npm run lint`, `npm test`, `npm run build` before deploy.
