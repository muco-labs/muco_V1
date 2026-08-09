# Phase 4.32 — Customer portal & project experience (MASTER 06)

## Executive summary

MASTER 06 **audited** the existing MUCO customer portal (`/app/*`), confirmed integration with MASTER 04 auth and MASTER 05 CRM handoffs, and **improved** information architecture, dashboard attention UX, project workspace navigation, payment status clarity, shared error copy, layout accessibility, and empty states—**without** new APIs, duplicate services, or database changes.

**Status: MASTER 06 — READY WITH LIMITATIONS**

Authenticated end-to-end portal QA (dashboard data, proposals, Razorpay, files, messaging) remains **BLOCKED** without Supabase customer session + `DATABASE_URL` (same as MASTER 04.1).

---

## 1. Existing architecture discovered

| Layer | Location |
|-------|----------|
| Routes | `src/app/router.tsx` — `/app` under `ProtectedPortal portal="customer"` |
| Layout | `src/layouts/CustomerAppLayout.tsx` |
| Dashboard | `src/pages/portal/customer/CustomerDashboardPage.tsx` |
| Feature pages | `src/pages/portal/customer/CustomerPortalPages.tsx` |
| Start project | `src/pages/start-project/*` (authenticated intake) |
| API client | `src/services/customer-portal.ts` → `/api/v1/customer/*` |
| Backend | `server/routes/v1/customer.ts` + `customer.service.js`, conversations, project-files, proposal-payment |
| Shared UI | `src/components/portal/CustomerPortalUi.tsx`, `ProjectDocumentsSection`, `ProjectDeliveryLifecycle`, etc. |
| Auth | MASTER 04 — session + `requirePortal('customer')` + permissions |

Legacy stub `CustomerAppHomePage.tsx` is **not** routed; index is the real dashboard.

---

## 2. Route inventory

| Route | Purpose | API (session-scoped) |
|-------|---------|----------------------|
| `/app` | Dashboard overview | `GET /customer/dashboard`, project requests |
| `/app/start-project` | Structured intake | project-intake APIs |
| `/app/project-requests` | List/detail requests | intake service |
| `/app/projects` | Delivery projects | `projects.*` |
| `/app/projects/:id` | Project workspace | `projects/:id`, files, messaging CTA |
| `/app/proposals` | Commercial proposals | `proposals.*` |
| `/app/proposals/:id` | Review / accept / pay | Razorpay via server intents |
| `/app/invoices` | Invoices | `invoices.*` |
| `/app/payments` | Payment history | `payments.*` |
| `/app/files` | Cross-project files | `files.*` |
| `/app/messages` | Conversations | `conversations.*` |
| `/app/support` | Tickets | `support.*` |
| `/app/notifications` | In-app notifications | `notifications.*` |
| `/app/profile`, `/app/settings` | Account | `profile` PATCH (safe fields) |

All routes require customer portal access; IDs in URLs are validated server-side against `requireCustomerContext`.

---

## 3. Before / after UX findings

| Area | Before | After (MASTER 06) |
|------|--------|-------------------|
| IA | Files buried under “More” | **Files** in primary nav |
| Dashboard | Equal-weight cards only | **Attention banner** for pending proposals/invoices/messages |
| Project detail | Long scroll, no anchors | **On-page section nav** (progress, milestones, files) |
| Errors | Raw API strings | **`friendlyCustomerPortalError`** across portal pages |
| Payments list | Generic status pill | **Tone-coded** payment status |
| Layout mobile | Menu toggle only | **Backdrop**, Escape close, skip link, focus labels |
| Empty copy | Duplicate “No messages yet” | Clearer guidance copy |

---

## 4. IA decisions

- Primary nav: Dashboard → Requests → Projects → Proposals → Payments → **Files** → Messages → Profile.
- Secondary (“More”): Start project, Invoices, Support, Notifications, Settings.
- Rationale: files and messaging are core delivery touchpoints; invoices remain secondary to proposals/payments.

---

## 5–12. Feature-area changes

- **Dashboard:** `PortalAttention` when pending actions or unread messages; 3-column grid at `≥48rem`.
- **Project:** `ProjectSectionNav` + `#project-files` anchor on documents section.
- **Proposals / payments / files / messages / account:** Improved empty states and friendly errors; no backend changes.
- **Design system:** Extended `CustomerPortalUi` (`PortalAttention`, `ProjectSectionNav`, status pill tones).

---

## 13. Accessibility

- Skip link to `#customer-main`.
- Mobile menu: `aria-label`, Escape dismiss, backdrop button.
- `focus-visible` on menu and section nav links.
- Skeleton shimmer respects `prefers-reduced-motion` (existing).

---

## 14. Responsive QA

**Code review:** layout uses `64rem` sidebar breakpoint; dashboard grid 1 → 3 columns; touch-friendly menu. **Live viewport matrix:** BLOCKED (no dev server in browser QA session).

---

## 15. Security findings

- No new IDOR surface; customer APIs unchanged.
- Existing tests: `project-fulfillment-access`, `proposal-fulfillment-access`, `payment-access`, `auth-gate.live.test.ts`.
- UI continues to rely on session-derived identity only.

---

## 16. Tests added

| File | Coverage |
|------|----------|
| `src/lib/customer/portal-errors.test.ts` | Error copy + payment tone |
| `src/lib/customer/customer-portal-nav.test.ts` | Primary nav includes Files |

---

## 17–18. Tests passed

**391 passed**, 2 skipped (full suite).

---

## 19–20. Build & lint

| Gate | Result |
|------|--------|
| `npm run lint` | 0 issues |
| `npm run build` | PASS |

---

## 21. Browser QA matrix

| Check | Result |
|-------|--------|
| Public site regression | Not re-run this session |
| `/auth/sign-in?from=/app` | **BLOCKED** — dev server not running (`chrome-error`) |
| Authenticated `/app/*` | **BLOCKED** — no customer credentials |
| Razorpay checkout UI | **BLOCKED** — requires live session + keys |

---

## 22. Blocked checks

1. `DATABASE_URL` + seeded customer data.
2. Supabase auth (customer test user).
3. Local `vite` dev/preview for interactive browser pass.
4. Razorpay sandbox payment confirmation.

---

## 23. Known limitations

- `CustomerAppHomePage.tsx` legacy stub still in repo (unused).
- Project detail could gain tabbed layout in a future pass; section anchors chosen for minimal diff.
- File list global page still uses `alert()` on download failure (pre-existing).

---

## 24. Remaining work

- Staging browser QA at 390–1920px with real customer account.
- Optional: replace `alert()` with inline `PortalError` on file download.
- Optional: consolidate `CustomerPortalPages.tsx` into route-level modules when file size becomes a maintenance issue.

---

## 25. Production-readiness status

**READY WITH LIMITATIONS** — UX and IA improvements are production-quality in code; **COMPLETE** requires authenticated staging verification per §21.

---

## Files changed / created

**Created**

- `src/lib/customer/portal-errors.ts`
- `src/lib/customer/portal-errors.test.ts`
- `src/lib/customer/customer-portal-nav.test.ts`
- `src/docs/PHASE4.32-CUSTOMER-PORTAL-PROJECT-EXPERIENCE-MASTER-REPORT.md`

**Modified**

- `src/config/customer-portal.ts`
- `src/layouts/CustomerAppLayout.tsx` + `.module.css`
- `src/components/portal/CustomerPortalUi.tsx` + `.module.css`
- `src/pages/portal/customer/CustomerDashboardPage.tsx`
- `src/pages/portal/customer/CustomerPortalPages.tsx`
- `src/components/portal/ProjectDocumentsSection.tsx`

**APIs touched:** none  
**Database changes:** none

---

## Regression

Masters 01–05 paths preserved. No CRM, SEO, or auth middleware changes.
