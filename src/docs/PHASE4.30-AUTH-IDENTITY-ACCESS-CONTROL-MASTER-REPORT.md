# Phase 4.30 — Identity, authentication, authorization & access control (MASTER 04)

**Scope:** Audit and harden identity architecture across Supabase Auth, Hono API, RBAC, and React portal guards—without CRM/portal feature expansion, deploy, or production env changes.

## Final readiness

**MASTER 04 — IDENTITY, AUTH & ACCESS CONTROL**  
**STATUS: READY WITH LIMITATIONS**

Repository architecture is audited, server enforcement patterns are documented, portal flags are aligned with freelancer approval (Phase 4.16), and security logic tests pass. **Authenticated browser QA and live IDOR API exercises were not run** in this workspace (no `VITE_SUPABASE_*`, no `DATABASE_URL`, no test accounts).

---

## 1. Authentication architecture

| Layer | Implementation |
|-------|----------------|
| Credentials & sessions | **Supabase Auth** (email/password, verification, recovery, refresh) |
| Browser session | `@supabase/supabase-js` via `AuthProvider` (`getSession`, `onAuthStateChange`, `signOut`) |
| API identity | `Authorization: Bearer <access_token>` → `verifySupabaseToken` → `supabase.auth.getUser` |
| Application user | `users` row linked by `users.auth_user_id` = Supabase `auth.users.id` |
| Roles & permissions | `user_roles` → `roles`; `role_permissions` → `permissions` (loaded in `loadAuthContext`) |
| Registration | `POST /api/v1/auth/register` (Bearer + customer profile); not open founder signup |
| Profile / portals | `GET /api/v1/auth/me`, `GET /api/v1/auth/session` |
| Docs | `server/docs/AUTH.md` |

**Flow:** Sign up/in (Supabase) → optional `POST /auth/register` → `GET /auth/me` resolves roles, permissions, **server portal flags** → client `ProtectedPortal` (UX) → API stacks `authenticate` + `requirePortal` / `requirePermission` + service scoping.

---

## 2. Identity source of truth

| Concern | Authoritative source |
|---------|----------------------|
| Password / session JWT | Supabase Auth |
| App user id | `users.id` (from `auth_user_id` lookup) |
| Role names | `roles.name` via `user_roles` |
| Permission grants | `permissions.name` via role joins (not client-supplied) |
| Customer scope | `customer_profiles` where `user_id` = session user (`requireCustomerContext`) |
| Employee scope | `employee_profiles` / org services (`requireEmployeeContext`) |
| Freelancer scope | `freelancer_profiles` where `user_id` = session user (`requireFreelancerContext`) |
| Account status | `users.status` — only `active` passes `loadAuthContext` |
| Portal UX flags | **`GET /api/v1/auth/me` → `portals`** (includes freelancer approval) |

There is no parallel auth system. Client `src/config/access.ts` duplicates portal **role** rules for fallback only; **`profile.portals` from `/me` is preferred**.

---

## 3. Role inventory

Canonical DB roles (`server/lib/auth/permissions.ts`):

| Role | Purpose |
|------|---------|
| `CUSTOMER` | Customer portal (`/app/*`) |
| `EMPLOYEE` | Team portal (`/team/*`) |
| `FREELANCER` | Freelancer workspace (`/app/freelancer/*`) after approval |
| `ADMIN` | Admin CRM (`/admin/*`) |
| `SUPER_ADMIN` | Extended admin (settings, payments.manage, etc.) |
| `FOUNDER` | Full admin capability set (seeded permissions) |

No new roles added in this master. Names preserved for migration compatibility.

---

## 4. Portal matrix (routes discovered in repo)

| Role(s) | UI root | API prefix | Route guard | API gate |
|---------|---------|------------|-------------|----------|
| CUSTOMER | `/app` | `/api/v1/customer` | `ProtectedPortal` customer | `authenticate` + `requirePortal('customer')` |
| EMPLOYEE, ADMIN, FOUNDER, SUPER_ADMIN | `/team` | `/api/v1/employee` | `ProtectedPortal` employee | `authenticate` + `requirePortal('employee')` |
| FREELANCER (approved) | `/app/freelancer` | `/api/v1/freelancer` | `ProtectedPortal` freelancer | `authenticate` + `requirePortal('freelancer')` + `requireFreelancerContext` |
| ADMIN, SUPER_ADMIN, FOUNDER | `/admin` | `/api/v1/admin` | `ProtectedPortal` admin | `authenticate` + `requirePortal('admin')` + per-route `requirePermission` |

Sign-in entry points: `/auth/sign-in` (customer), `/team/sign-in`, `/admin/sign-in`.

---

## 5. Permission matrix

**Canonical permission list:** `permissionNames` in `server/lib/auth/permissions.ts` (52 permissions including `projects.*`, `tasks.*`, `files.*`, `messages.*`, `freelancers.*`, `careers.*`, `website_intelligence.*`, etc.).

**Default grants per role:** `server/lib/auth/role-permissions.ts` (seeded via migrations / `db:seed`).

| Role | Pattern |
|------|---------|
| CUSTOMER | Own data: projects, proposals, invoices, payments, files, messages, support |
| EMPLOYEE | Delivery + leads; **no** `payments.manage`, no admin user management |
| FREELANCER | **Empty** default permission set; access via assignment + `requireFreelancerContext` |
| ADMIN | Broad CRM/delivery; no `settings.manage` / `payments.manage` (vs SUPER_ADMIN) |
| SUPER_ADMIN / FOUNDER | Full operational set including `proposals.approve`, `payments.manage`, `settings.manage` |

Fine-grained admin routes use `requirePermission('…')` in `server/routes/v1/admin.ts`.

---

## 6. Session behavior

- Tokens: Supabase session (not stored in app `localStorage` beyond Supabase client defaults).
- Refresh: Supabase client handles refresh; API rejects invalid/expired tokens with **401** (`UNAUTHORIZED`).
- Logout: `signOut()` clears client session; subsequent API calls lack Bearer token → 401.
- Inactive users: `loadAuthContext` → **403**; `/me` returns registered profile with empty roles/portals when status ≠ `active`.
- Multi-tab: `onAuthStateChange` syncs session.

---

## 7. Customer isolation

**Enforcement:** `requireCustomerContext` → `customerId` from `customer_profiles.user_id` only.

**Pattern:** All customer service queries include `eq(*.customerId, ctx.customerId)` or `getOwnedProject(customerId, projectId)` (`server/services/customer.service.ts`).

**Resources:** dashboard, projects, proposals, invoices, payments, files, messages, conversations, support, profile, project requests.

**IDOR policy:** Route params (projectId, proposalId, etc.) are validated against session-derived `customerId`; body `customerId` is not trusted.

---

## 8. Employee isolation

**Enforcement:** `requireEmployeeContext` + project/task membership in `employee.service.ts` and CRM services.

**Portal:** `requirePortal('employee')` on all `/api/v1/employee/*` routes.

Employees do not receive customer portal mapping; admin routes require admin portal + permissions (not URL secrecy).

---

## 9. Freelancer isolation

**Gate (Phase 4.16 preserved):** `requireFreelancerContext`:

- Linked `freelancer_profiles` row for `auth.userId`
- `approvalStatus === 'approved'`
- `FREELANCER` role present

**Assignments:** Project/task access only through assignment services (`freelancer-delivery.service.ts`); no self-assign (covered in `freelancer-*` tests).

**MASTER 04 hardening:**

- `resolvePortalAccessFlags` — freelancer portal only when role + **approved**
- `/api/v1/auth/me` uses flags + optional `freelancer.approvalStatus`
- `AuthProvider.canAccessPortal` prefers `profile.portals` from server
- `ProtectedPortal` redirects non-approved freelancers to `/freelancers/apply`

---

## 10. Admin / founder security

- `adminRoutes.use('*', authenticate)` and `requirePortal('admin')` after bootstrap route.
- Founder bootstrap: `POST /api/v1/admin/bootstrap/founder` — secret + rate limit; returns 404 if secret unset.
- Sensitive actions: `requirePermission`, `requirePricingAuthority`, `requireFinancialPermission` in services.

---

## 11. IDOR audit

| ID type | Server pattern |
|---------|----------------|
| customerId | From session only (`CustomerContext`) |
| projectId / proposalId / invoiceId / fileId | Scoped queries + ownership helpers (`customerOwnsProject`, etc.) |
| taskId / milestoneId | Employee/freelancer assignment checks |
| freelancerId | `ctx.freelancerId` from profile linked to user |
| conversationId / messageId | Customer/employee conversation services scope by participant |

Systematic replacement of IDs in API calls **with live sessions** was **not executed** (no DB/auth env). Logic-level tests and existing freelancer/customer test suites document expectations.

---

## 12. Permission escalation audit

| Vector | Mitigation |
|--------|------------|
| Navigate to `/admin` without role | `ProtectedPortal` + API 403 |
| CUSTOMER → admin API | `requirePortal('admin')` |
| EMPLOYEE → payments.manage | Permission not in default EMPLOYEE set |
| Body `role` / `customerId` | Not used for authorization decisions |
| FREELANCER without approval | API 403; portal flag false |

Added tests: `server/lib/auth/identity-access-master.test.ts`, `portal-access.test.ts`.

---

## 13. Private data boundary

- Portal layouts set `PageMeta` **noIndex** (customer, employee, freelancer, admin).
- `robots.txt` disallows `/app/`, `/admin/`, `/team/`, `/auth/`.
- API errors via `handleRouteError` — no stack traces to client; generic 500 message.
- No service-role or DB URLs in `src/` bundle (`server/lib/env.ts` server-only).

---

## 14. API security

- **401** — missing/invalid Bearer token
- **403** — authenticated but forbidden (role, permission, approval, inactive account)
- **404** — not found / not exposed (`AppError` in services)
- **429** — rate limits on auth register, leads, bootstrap, etc.

---

## 15. Rate limiting

`server/middleware/rate-limit.ts` — used on:

- `POST /api/v1/auth/register` (`authRateLimit` from `AUTH_RATE_LIMIT_*`)
- `POST /api/v1/leads`
- `POST /api/v1/admin/bootstrap/founder` (5/hour)

---

## 16. Auth UI / UX

Pages: sign-in, sign-up, forgot/reset password, verify email, unauthorized, team/admin sign-in (`src/pages/Auth*.tsx`, `TeamSignInPage`, `AdminSignInPage`).

When Supabase is unset, forms show `authCopy.supabaseMissing` (no fake login).

---

## 17. Redirect behavior (browser QA — unauthenticated)

| URL | Result (preview :4173) |
|-----|-------------------------|
| `/app` | → `/auth/sign-in` |
| `/admin` | → `/admin/sign-in` |

No redirect loops observed. Authenticated role-specific redirects **not tested** (Supabase not configured).

---

## 18. Account status

Supported in `loadAuthContext`: **`active`** only for API access.

Other statuses (`pending`, `invited`, `suspended`, `disabled`, `inactive` per schema/docs) → **403** on protected APIs; `/me` may return status with empty portals.

Email verification: `activateAccountIfEligible` on register/me.

---

## 19. Secrets audit

| Secret | Location | Browser exposure |
|--------|----------|------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `server/lib/env.ts` | No |
| `DATABASE_URL` | server env | No |
| `RAZORPAY_*` | server env | No (`keyId` only where intended for checkout) |
| `AUTH_SECRET` / `FOUNDER_BOOTSTRAP_SECRET` | server env | No |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Yes (intended) |

No hardcoded live credentials found in application source. Placeholders in `.env.example` / docs only.

---

## 20. SEO / private-route boundary

Unchanged from MASTER 03: portals noindex; sitemap excludes `/app`, `/admin`, `/team`, `/auth`. See `PHASE4.29-SEO-SEARCH-ARCHITECTURE-MASTER-REPORT.md`.

---

## 21. Tests added

| File | Purpose |
|------|---------|
| `server/lib/auth/portal-access.test.ts` | Freelancer approval portal flags |
| `server/lib/auth/identity-access-master.test.ts` | Escalation matrix, permission defaults, gate alignment |

---

## 22. Tests passed

```
npx vitest run --pool=threads --maxWorkers=2
→ 63 files, 372 tests passed
```

(Includes existing `security-audit.test.ts`, `customer-access.test.ts`, freelancer hardening suites.)

---

## 23. Build

`npm run build` — **pass**

---

## 24. Lint

`npm run lint` (oxlint) — **0 issues**

---

## 25. Browser QA

| Scenario | Result |
|----------|--------|
| Unauthenticated `/app`, `/admin` | Redirect to correct sign-in |
| 390px / 1280px | Not re-run per viewport; layout uses existing responsive shells |
| Authenticated customer/employee/freelancer/admin | **Blocked** — Supabase env missing |

---

## 26. Blocked QA (dependencies)

1. `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (client)
2. `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server)
3. `DATABASE_URL` + migrations + seed roles
4. Test users per role for IDOR API calls and portal journeys

---

## 27. Fixes made (this master)

1. **`resolvePortalAccessFlags`** — server-authoritative portal map; freelancer requires **approved** profile.
2. **`GET /api/v1/auth/me`** — uses resolver; returns `freelancer.approvalStatus`; inactive-user portals include `freelancer: false`.
3. **`AuthProvider`** — `canAccessPortal` uses `profile.portals` when present.
4. **`ProtectedPortal`** — pending freelancers redirected to `/freelancers/apply`.
5. **Security tests** — portal escalation and approval alignment.
6. **`src/config/access.ts`** — documents server portal precedence.

---

## 28. Remaining limitations

- Live **IDOR** and **cross-tenant** API tests need configured auth + DB.
- **RLS** (`0002_row_level_security.sql`) supplements API; validate in Supabase when using direct client access.
- Optional: prerender/SSR does not affect auth; session remains Supabase-centric.

---

## 29. Final security matrix (summary)

| Resource area | CUSTOMER | EMPLOYEE | FREELANCER | ADMIN/FOUNDER | PUBLIC |
|---------------|----------|----------|------------|---------------|--------|
| Own projects/tasks | View (own) | View (assigned) | View (assigned) | View all (perm) | — |
| Proposals/payments | View/approve own | No default pay manage | — | Manage (perm) | — |
| CRM/leads | — | View/update (perm) | — | Full (perm) | Lead form only |
| Files/messages | Own scope | Work scope | Assignment scope | Admin (perm) | — |
| Freelancer network | — | — | Own profile | Manage (perm) | Apply only |
| User/employee admin | — | — | — | Yes (perm) | — |

**PUBLIC:** marketing routes, careers read APIs, product waitlist, webhooks (signed), unauthenticated lead capture.

---

## 30. Final readiness status

| Criterion | Status |
|-----------|--------|
| Architecture audited | Yes |
| Server authorization model documented | Yes |
| Customer/employee/freelancer isolation patterns verified in code | Yes |
| Admin protection (middleware) verified | Yes |
| IDOR live testing | **No** (env) |
| Authenticated browser QA | **No** (env) |
| Tests / build / lint | Yes |
| Report | This document |

**MASTER 04:** **READY WITH LIMITATIONS** until Supabase + database + role test accounts enable authenticated QA.

When those dependencies are satisfied, re-run portal matrix browser tests and targeted IDOR API scripts, then status may be elevated to **COMPLETE**.
