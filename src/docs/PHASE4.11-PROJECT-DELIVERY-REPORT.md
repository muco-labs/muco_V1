# Phase 4.11 — Project Delivery (internal notes)

## What was inspected

- `createProjectFromProposal` legacy active status
- Customer dashboard project summaries
- Milestone `sortOrder` and admin milestone APIs
- Payment readiness helpers from Phase 4.10
- Project completion workflow
- Customer/admin project portal pages

## What was already correct

- Milestone-only customer progress
- Payment gate on explicit project start
- Audit timeline and RBAC on project/milestone mutations
- Terminal project status enum and transition map

## What was implemented

- Proposal-created projects respect payment readiness (`draft` when payment required; `active` when not)
- Customer dashboard delivery enrichment (current milestone, progress, overdue note)
- Milestone reorder API (`POST .../reorder` with `up`/`down`)
- Terminal project milestone mutation guard
- Completion workflow status guards
- Customer detail: next milestone, last update, next action copy
- Admin detail: overdue count, next delivery action, reorder controls
- Milestone started customer notification (event-based)

## API changes

- `POST /api/v1/admin/projects/:id/milestones/:milestoneId/reorder`
- Enriched `GET /api/v1/customer/dashboard` project items
- Enriched `GET /api/v1/customer/projects/:id` and admin project detail payloads

## Database changes

DATABASE CHANGES: NONE

## Security verification

- Reorder validates milestone belongs to project path `id`
- Terminal projects block milestone create/update
- Customer DTOs omit milestone UUIDs
- No change to customer mutation surface

## Tests

See `project-delivery-phase411.test.ts` and extended lib tests.

## Readiness

READY WITH LIMITATIONS — no browser E2E; no scheduled overdue notifications.
