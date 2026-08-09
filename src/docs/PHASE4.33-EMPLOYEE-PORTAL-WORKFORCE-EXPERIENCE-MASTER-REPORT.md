# Phase 4.33 — Employee portal & workforce experience (MASTER 07)

## Executive summary

MASTER 07 **audited** the authenticated employee workspace (`/team/*`), mapped permissions to existing `server/routes/v1/employee.ts` and `employee.service.ts`, and **improved** work-focused IA, dashboard attention UX, layout accessibility, task/project navigation, and employee-safe error messaging—**without** new APIs, database migrations, or fabricated metrics.

**Status: MASTER 07 — READY WITH LIMITATIONS**

Live authenticated employee IDOR/browser verification remains **BLOCKED** without Supabase employee session + `DATABASE_URL` (MASTER 04.1).

---

## 2. Existing employee architecture

| Layer | Location |
|-------|----------|
| Routes | `src/app/router.tsx` — `/team` under `ProtectedPortal portal="employee"` |
| Layout | `src/layouts/EmployeeAppLayout.tsx` |
| Dashboard | `src/pages/portal/employee/EmployeeDashboardPage.tsx` |
| Feature pages | `src/pages/portal/employee/EmployeePortalPages.tsx` |
| API client | `src/services/employee-portal.ts` → `/api/v1/employee/*` |
| Backend | `server/routes/v1/employee.ts`, `server/services/employee.service.ts` |
| Auth | `authenticate` + `requirePortal('employee')` + per-route `requirePermission` |
| Shared UI | Reuses `CustomerPortalUi` primitives (intentional design-system sharing) |

Sign-in entry: `/team/sign-in` (`authRoutes.teamSignIn`).

---

## 3. Route inventory

| Route | Purpose | Permissions (typical) |
|-------|---------|------------------------|
| `/team` | Dashboard | employee portal |
| `/team/tasks` | Task list + filters | `tasks.view` |
| `/team/tasks/:id` | Task detail + status update | `tasks.view`, `tasks.update` |
| `/team/projects` | Assigned projects | `projects.view` |
| `/team/projects/:id` | Project workspace | `projects.view` (assignment scoped) |
| `/team/files` | Authorized files | `files.view` |
| `/team/messages` | Project messages | `messages.view` / `messages.send` |
| `/team/notifications` | User notifications | portal |
| `/team/deadlines` | Due dates aggregate | portal |
| `/team/profile` | Profile PATCH | portal |
| `/team/settings` | Account links | portal |

Task access: `getEmployeeTask` enforces `assignedEmployeeId === ctx.employeeId` (404 otherwise).

Project access: `getAssignedProjectIds` + membership checks in service layer.

---

## 4. Navigation audit

**Before:** Flat 9-item nav; “Team sign-in” link while already authenticated.

**After:** Primary = work routes; **More** = notifications, profile, settings; footer **Back to mucolabs.com**; accent active state aligned with customer portal.

---

## 5. Dashboard audit

Uses real `getEmployeeDashboard` fields: `myTasks`, `dueSoonTasks`, `blockedTasks`, `assignedProjects`, `unreadNotificationCount`.

**Added:** `PortalAttention` for blocked / due-soon / unread; “View all” links; task status tones.

**Not added:** productivity scores, rankings, hours, payroll (not in backend).

---

## 6–11. Task / project / files / messaging / notifications / profile

- **Tasks:** Friendly errors; save state without `alert()`; project link from task; due date display.
- **Projects:** Section nav; task rows link to task detail; back link.
- **Files / messages:** Improved empty copy; friendly errors (download still uses `alert` when unavailable — pre-existing).
- **Notifications / deadlines / profile:** Friendly errors; no backend change.

---

## 12. Permission matrix (summary)

| Action | EMPLOYEE | CUSTOMER | FREELANCER | ADMIN |
|--------|----------|----------|------------|-------|
| Employee portal | ALLOW* | DENY | DENY | DENY** |
| `tasks.view` / `tasks.update` | ALLOW* | DENY | DENY | ALLOW*** |
| `projects.view` (assigned) | SCOPED* | DENY | SCOPED**** | ALLOW*** |
| CRM / leads | DENY* | DENY | DENY | ALLOW*** |
| `payments.manage` | DENY | DENY | DENY | ALLOW*** |

\* With employee role + portal flag.  
\** Unless user also has employee role.  
\*** With permissions.  
\**** Freelancer project scope separate.

Existing tests: `permissions.test.ts`, `customer-access.test.ts`, `project-fulfillment-access.test.ts`, `crm-access.test.ts`, `auth-gate.live.test.ts` (`/api/v1/employee/dashboard` unauthenticated).

---

## 13. Security findings

- **No new IDOR surface** introduced.
- Task update remains server-validated (`assignedEmployeeId`, `tasks.update`).
- UI hardening: no security-only button hiding; backend unchanged.
- Live pairwise IDOR: **BLOCKED** (no tokens).

---

## 14–16. UX / design / accessibility

- Work-first hierarchy; shared MUCO tokens via `CustomerPortalUi`.
- Skip link, mobile backdrop, Escape, menu `aria-label`, `#employee-main`.
- Semantic headings preserved; form labels on filters and task status.

---

## 17. Responsive

Code: `64rem` sidebar, wrapping filters, `cardGrid` 3-column at `≥48rem`. **Live matrix:** BLOCKED (no dev server in QA).

---

## 18. Performance

No new dependencies; reuses existing `useFetch` patterns.

---

## 19–20. Tests

| Added | Purpose |
|-------|---------|
| `src/lib/employee/portal-errors.test.ts` | Error + task tone |
| `src/lib/employee/employee-portal-nav.test.ts` | IA structure |

**395 passed**, 2 skipped (full suite).

---

## 21–22. Build & lint

| Gate | Result |
|------|--------|
| Lint | 0 issues |
| Build | PASS |

---

## 23. Browser QA matrix

| Check | Result |
|-------|--------|
| `/team/sign-in` | **BLOCKED** — dev server not running |
| Authenticated `/team/*` | **BLOCKED** — no employee session |

---

## 24. Security QA matrix

| Check | Result |
|-------|--------|
| Unauthenticated API denial | Covered by `auth-gate.live.test.ts` |
| Employee A → Employee B task | **BLOCKED** live |
| Employee → unauthorized project | **BLOCKED** live |

---

## 25–28. Blocked / limitations / remaining / readiness

**Blocked:** DB, Supabase employee account, preview server, MASTER 04.1 bearer tokens.

**Limitations:** Employee messages UI is basic (no threaded conversation model like customer portal).

**Remaining:** Staging responsive + IDOR pass; optional inline file download errors.

**Readiness:** **READY WITH LIMITATIONS**

---

## Files changed / created

**Created**

- `src/lib/employee/portal-errors.ts`
- `src/lib/employee/portal-errors.test.ts`
- `src/lib/employee/employee-portal-nav.test.ts`
- `src/pages/portal/employee/EmployeeDashboardPage.module.css`
- `src/docs/PHASE4.33-EMPLOYEE-PORTAL-WORKFORCE-EXPERIENCE-MASTER-REPORT.md`

**Modified**

- `src/config/employee-portal.ts`
- `src/layouts/EmployeeAppLayout.tsx` + `.module.css`
- `src/pages/portal/employee/EmployeeDashboardPage.tsx`
- `src/pages/portal/employee/EmployeePortalPages.tsx`

**APIs touched:** none  
**Database changes:** none  
**Security fixes:** none required (audit only)
