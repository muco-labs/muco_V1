# Phase 4.20 — Freelancer Discovery & Matching Foundation

## Readiness

**READY WITH LIMITATIONS** — `313` tests pass with `npx vitest run --pool=threads --maxWorkers=2`; `npm run build` and `npm run lint` pass. No E2E harness; **manual browser verification not performed** this session.

---

## 1. Audit

Reused without duplication:

- `freelancer_profiles`, `freelancer_services`, `freelancer_skills` (4.16–4.18)
- Availability + workload (4.19) via `isFreelancerOpenForNewAssignments` and `computeFreelancerWorkloadSummariesBatch`
- Assignment via existing `addProjectFreelancerAdmin` and `updateTask` (4.17)
- MUCO catalog slugs from `muco-service-catalog.ts`
- Project `service` text field (normalized to slug when possible)

No new DB tables or migrations.

## 2. Architecture

- **Discovery layer** (`discoverFreelancersAdmin`) finds and explains candidates.
- **Assignment layer** unchanged — admin UI calls existing project/task APIs; server re-validates eligibility.

## 3. Discovery model

```
Requirement (service / optional skill / project / task)
  → active freelancer service offering (exact slug)
  → optional structured skill row
  → approval + link + open to projects
  → availability (exclude unavailable)
  → batch workload (4.19 rules)
  → explainable candidate DTO
```

Deterministic ordering: match tier → availability → lower active tasks → name.

## 4. Matching signals

- **Service match**: effectively active `freelancer_services.service_slug`
- **Skill match**: `freelancer_skills` row when skill filter set (no free-text inference)
- **Reasons**: categorical strings (e.g. Service match, Limited availability, Already on project, High current workload when active tasks ≥ 8)
- No AI scores or fake metrics

## 5. APIs

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/admin/freelancers/discover` | `freelancers.view` |
| GET | `/api/v1/admin/freelancers/service-catalog` | `freelancers.view` |

Query: `service`, `skill`, `projectId`, `taskId`, `q`, `availability`, `pricingType`, `page`, `limit`.

Project/task IDs validated server-side; task must belong to project when both supplied.

## 6. Admin UX

- `/admin/freelancers/discover` — standalone discovery
- Project detail — embedded `AdminFreelancerDiscoveryPanel` + links from freelancers section
- Task row — **Find freelancer** scrolls to panel with `discoverTask` query param
- Assign buttons call existing `POST .../freelancers` and `PATCH .../tasks/:id`

## 7. Security / RBAC

- `freelancers.view` for discovery; `projects.assign` / `tasks.update` for assign actions in UI
- Customers and freelancers lack `freelancers.view` (tested)
- Customer project DTOs unchanged
- Internal base pricing only on admin discovery responses

## 8. Performance

- Scoped profile + service queries; skills batch when needed
- Single batch workload query pair for candidate IDs (no per-row workload N+1)
- Pagination default 25, max 50

## 9. Tests

`server/lib/freelancers/freelancer-discovery.test.ts` — slug normalization, tiers, reasons, ordering, query validation, RBAC, customer isolation.

**Count:** 313 tests (55 files).

## 10. Build / lint

- **Build:** pass  
- **Lint:** pass (pre-existing warnings only)

## 11. Manual verification

Not run in this session. Suggested: admin discover by service/skill, assign limited vs reject unavailable, task assign via existing API, confirm customer portal unchanged.

## 12. Regression

Phases 4.16–4.19 assignment, offerings, availability, CRM, customer portal — no intentional removals.

## 13. Limitations

- Broad search without service requires `q` or returns hint
- Project `service` must normalize to a known slug for auto-derive
- No recommendation history, marketplace, or auto-assignment
- High workload threshold is a fixed documented constant (8 active tasks)

## 14. Not implemented

AI matching, auto-assignment, public marketplace, customer browsing, bidding, ratings, payouts, wallet, notifications on search, audit noise on every search.

## 15. Readiness status

**READY WITH LIMITATIONS** — complete for Phase 4.20 scope pending manual QA.
