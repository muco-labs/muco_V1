# Phase 5 — Operations audit (baseline)

## Already automated (pre–Phase 5)

| Flow | Implementation |
|------|----------------|
| Lead intake | `POST /api/v1/leads`, re-inquiry, notifications |
| Proposal send | Admin send → customer notification + email |
| Proposal → project | `createProjectFromProposal` (idempotent if `projectId` set) |
| Payment verify | Razorpay signature + webhook idempotency in `payment.service` |
| Project complete | `completeProjectWorkflow` (blocks if open tasks) |
| Progress % | `computeProjectProgressFromTasks` from tasks + milestones |
| Operations report | `GET /admin/operations/report` |
| Audit log | `audit_logs` table + admin UI |

## Manual by design

- Proposal pricing / discounts (admin permissions)
- Sending proposals (explicit send action)
- Lead qualification decisions
- Refunds and permission changes
- Marketing email (no auto-send on inquiry)

## Phase 5 additions

- Project templates (`website`, `software`) → milestones + tasks via `POST /projects/:id/apply-template`
- Richer operations metrics (qualified leads, at-risk projects, tasks due soon)
- Admin dashboard operational widgets
- Automation-focused audit filter (`/audit-logs/automation`)
- `project_started` transactional email (was incorrectly using `proposal_sent`)
- Employee dashboard: due soon / blocked task slices

## Scheduling

No new cron jobs — follow-up reminders remain manual scheduling in CRM. Document serverless limitation in report.
