# Phase 4.35 — Admin portal & operations (MASTER 09)

## Executive summary

MASTER 09 **audited** the MUCO admin control center (`/admin/*`), mapped routes to permissions and existing services (CRM, delivery, commercial, freelancer 4.16–4.22), and **improved** operational IA (grouped navigation), dashboard attention UX, layout accessibility, and admin-safe API error copy—**without** new APIs, tables, or permission systems.

**Status: MASTER 09 — READY WITH LIMITATIONS**

Authenticated admin browser QA and live IDOR/privilege-escalation testing remain **BLOCKED** without admin Supabase session + `DATABASE_URL` (MASTER 04.1).

---

## 2. Existing architecture

| Layer | Location |
|-------|----------|
| Routes | `src/app/router.tsx` — `/admin` + `ProtectedPortal portal="admin"` |
| Layout | `AdminAppLayout.tsx` |
| Dashboard | `AdminDashboardPage.tsx` → `GET /api/v1/admin/dashboard` |
| CRM | `CrmPortalPages.tsx` (MASTER 05) |
| Operations hub | `AdminPortalPages.tsx` (customers, projects, tasks, proposals, payments, audit, etc.) |
| Freelancers | `AdminFreelancerPages.tsx` + discovery panel (4.20–4.22) |
| Config | `admin-portal.ts` — paths, permissions, nav |
| Backend | `server/routes/v1/admin.ts` + domain services |
| RBAC | `requirePermission` per route; `adminNavForPermissions` on client |

Revenue/payment figures on dashboard are **aggregated from DB** (`revenueSucceeded`, `outstandingInvoicesTotal`)—not fabricated.

---

## 3. Route inventory (summary)

Core paths in `adminPortalPaths`: dashboard, CRM/leads, customers, employees, freelancers (+ discover), projects, tasks, proposals, invoices, payments, files, messages, support, audit logs, settings, security, careers, local markets, website intelligence, operations/sales/revenue, executive, team access, analytics, notifications.

Each maps to `admin.ts` handlers with explicit permissions (e.g. `leads.view`, `customers.view`, `freelancers.view`, `audit_logs.view`).

---

## 4. Information architecture

**Before:** Flat permission-filtered list (25+ items).

**After:** Seven sections (Overview, CRM & growth, People, Delivery, Commercial, Support & comms, System) via `adminNavSectionsForPermissions()`—same items, same permission gates, clearer scanability.

---

## 5. Dashboard

Real metrics preserved. **Added** `PortalAttention` with deep links when counts &gt; 0 for: new leads, pending proposals, overdue invoices, open support, tasks due in 7 days.

---

## 6–19. Domain audits (by reference)

| Area | Status |
|------|--------|
| CRM (MASTER 05) | Unchanged lifecycle; friendly errors in CRM pages |
| Customers / employees | Existing `AdminPortalPages` CRUD; server RBAC |
| Freelancers | 4.16–4.22 preserved; discovery/assignment untouched |
| Projects / tasks / proposals / payments | Existing fulfillment + Razorpay server paths |
| Files / messages / audit | Permission-gated admin APIs |
| Dangerous actions | Existing confirmations in CRM/assignment flows (not redesigned) |

---

## 20–23. Security / permissions / IDOR

- Permission matrix: use `defaultRolePermissions` + `adminNav` permission fields (documented in report appendix via existing tests: `crm-access`, `org-access`, `freelancer-assignment-workflow`, `auth-gate.live.test.ts`).
- **Live IDOR / privilege escalation:** BLOCKED.
- No secrets exposed in UI changes.

---

## 24–26. UI / responsive / accessibility

Grouped nav labels, skip link, mobile backdrop, Escape, `#admin-main`, friendly errors across major admin page modules.

**Live responsive QA:** BLOCKED.

---

## 27–29. Tests / lint / build

| Added | Purpose |
|-------|---------|
| `src/lib/admin/admin-portal-nav.test.ts` | Section IA + permission filter |
| `src/lib/admin/portal-errors.test.ts` | Error copy |

**402 passed**, 2 skipped (full suite at time of run). Lint **0**. Build **PASS**.

---

## 30. Browser QA

| Check | Result |
|-------|--------|
| `/admin/sign-in` | BLOCKED (no dev server) |
| Authenticated admin walkthrough | BLOCKED |

---

## 31–33. Blocked / limitations / readiness

**Blocked:** staging DB, admin bearer tokens, preview server.

**Limitations:** Flat `adminNav` still exported for compatibility; destructive-action UX not globally re-audited in UI this pass.

**Readiness:** **READY WITH LIMITATIONS**

---

## Files changed / created

**Created**

- `src/lib/admin/portal-errors.ts`
- `src/lib/admin/portal-errors.test.ts`
- `src/lib/admin/admin-portal-nav.test.ts`
- `src/docs/PHASE4.35-ADMIN-PORTAL-OPERATIONS-MASTER-REPORT.md`

**Modified**

- `src/config/admin-portal.ts`
- `src/layouts/AdminAppLayout.tsx`
- `src/pages/portal/admin/AdminDashboardPage.tsx`
- `src/pages/portal/admin/AdminPortalPages.tsx`
- `src/pages/portal/admin/CrmPortalPages.tsx`
- `src/pages/portal/admin/AdminFreelancerPages.tsx`
- `src/pages/portal/admin/AdminCareersPages.tsx`
- `src/pages/portal/admin/AdminCareersJobPages.tsx`
- `src/pages/portal/admin/WebsiteIntelligencePages.tsx`
- `src/pages/portal/admin/AdminExecutivePage.tsx`
- `src/pages/portal/admin/AdminTeamAccessPage.tsx`
- `src/pages/portal/admin/AdminProductWaitlistPage.tsx`

**APIs touched:** none  
**Database changes:** none

---

## Regression

Masters 01–08 and freelancer 4.16–4.22 backend behavior unchanged.
