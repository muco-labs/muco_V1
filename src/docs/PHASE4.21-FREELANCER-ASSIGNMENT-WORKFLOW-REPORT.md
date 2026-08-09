# Phase 4.21 — Freelancer Assignment Workflow & Matching Execution

## Readiness

**READY WITH LIMITATIONS** — `323` tests with `npx vitest run --pool=threads --maxWorkers=2`; `npm run build` and `npm run lint` pass. No E2E harness; **manual browser verification not performed** this session.

---

## 1. Audit findings

- **Persistence:** `addProjectFreelancerAdmin` and `updateProjectTaskAdmin` (Phase 4.17) — unchanged; sole assignment path.
- **Discovery:** Phase 4.20 `discoverFreelancersAdmin` — unchanged search/match; assignment flags tightened for task employee/other-freelancer assignees.
- **Eligibility:** Phase 4.19 `assertFreelancerAvailableForNewAssignment` + `isFreelancerEligibleForProjectAssignment` re-run on every assign API call.
- **Notifications / audit:** Existing project/task assignment side effects in assignment services (no duplicate sends from UI).
- **UI gap (4.20):** Candidates assigned on button click — **fixed in 4.21** with select → confirm modal.

## 2. Architecture

```
Discovery (4.20) → Select (UI) → Confirm (Modal) → Existing APIs (4.17) → DB → Audit/Notify
```

No new tables, routes, or assignment services.

## 3. Workflow

1. Search candidates (discovery API).
2. **Select for project** / **Select for task** — opens confirmation only.
3. **Confirm assignment** — calls `POST /projects/:id/freelancers` or `PATCH /projects/:id/tasks/:taskId`.
4. Server revalidates all guards; on failure, no assignment, no optimistic UI.
5. `onAssigned` refreshes project team/tasks (existing parent callbacks).

## 4. Project assignment

- Confirmation shows: freelancer, project, role, availability, service/skill match, workload counts.
- Uses existing `adminApi.projects.addFreelancer`.

## 5. Task assignment

- Confirmation includes task title when `taskId` context present.
- Discovery disables task select when: not on project, employee assignee, other freelancer assignee, or already assignee.
- Uses existing `adminApi.projects.updateTask` with `assignedFreelancerId`.
- Replacement of another freelancer/employee requires task row assignee control (not silent from discovery).

## 6. Server-side validation

All final checks remain in Phase 4.17 services (approval, availability, project/task terminal state, membership, RBAC, duplicate project row → 409 CONFLICT). Discovery DTOs are never trusted.

## 7. Concurrency

Stale confirm after another admin assigns: second request fails with validation/conflict; UI shows API error message via `ApiError`.

## 8. APIs

**No new endpoints.** Same as Phase 4.17/4.20.

## 9. UI changes

- `AdminFreelancerDiscoveryPanel.tsx` — Modal (`@/components/ui/Modal`), select/confirm, candidate label, server error text.
- `freelancer-discovery.service.ts` — task employee assignee in context; stricter `canAssignToTask`.

## 10. Lib

- `freelancer-assignment-workflow.ts` — documented UI contract helpers + tests.

## 11. Security / RBAC

Unchanged permissions: `freelancers.view`, `projects.assign`, `tasks.update`. Customer isolation unchanged.

## 12. Tests

- `freelancer-assignment-workflow.test.ts` — confirm contract, task/project discovery gates, eligibility, terminal states, RBAC.
- Prior phase tests remain green.

**Count:** 323 tests (56 files).

## 13. Build / lint

- **Build:** pass  
- **Lint:** pass (pre-existing warnings only)

## 14. Manual verification

Not run. Recommended: cancel confirm → no assign; confirm → team/task refresh; unavailable rejected on confirm.

## 15. Not implemented

Auto-assignment, new orchestration APIs, assignment status tables, email/SMS, customer visibility.

## 16. Readiness status

**READY WITH LIMITATIONS** — workflow complete; manual QA pending.
