# Phase 4.31 — CRM → Lead → Customer conversion (MASTER 05)

**Scope:** Audit and consolidate the existing MUCO business pipeline (lead → customer → proposal → payment → project). No duplicate systems, no AI scoring, no payment redesign, no deploy.

## Final readiness

**MASTER 05 — READY WITH LIMITATIONS**

The repository already implements a full CRM pipeline, admin UX, and handoffs. This master **audited** that architecture, **hardened** lead status transitions and conversion idempotency, and **extended tests**. **Live end-to-end** flow (submit lead → CRM → convert → proposal → Razorpay → project) is **BLOCKED** without `DATABASE_URL`, Supabase auth, and payment sandbox in this workspace (same as MASTER 04.1).

---

## 1. Existing architecture audit

| Layer | Location | Role |
|-------|----------|------|
| Lead intake (public) | `POST /api/v1/leads` | Contact / marketing enquiries |
| Project intake | `project-intake.service.ts`, customer `/app/start-project` | Structured requests; creates `leads` row linked to `customerId` |
| CRM core | `server/services/crm.service.ts` | List, pipeline, detail, notes, follow-ups, interactions, convert |
| Admin CRM UI | `src/pages/portal/admin/CrmPortalPages.tsx`, CRM components | Pipeline, lead detail, proposals/projects panels |
| Admin APIs | `server/routes/v1/admin.ts` | `/leads`, `/crm/*`, convert, create-proposal, create-project |
| Employee CRM (scoped) | `server/routes/v1/employee.ts` | `GET /leads`, `GET /leads/:id` with assignment scope |
| Legacy admin leads | `admin.service.ts` | Dashboard counts, simple lead CRUD (older paths) |
| Customer | `customer_profiles` + `users` | Portal identity via Supabase + `inviteCustomerFromLead` |
| Proposals / payments / projects | `proposal-fulfillment`, `proposal-payment`, `project-delivery`, `workflow` | Existing fulfillment stack |
| Audit | `audit_logs`, `lead_activities`, `lead_interactions`, `lead_notes` | Traceability |
| Permissions | `leads.view/create/update/assign`, `customers.create`, etc. | RBAC on all mutations |

Prior docs: `PHASE4-LEAD-GENERATION-REPORT.md`, `PHASE4-LEAD-GENERATION-AUDIT.md`.

---

## 2. Data model (source of truth)

```
leads (enquiry / intake; may link customer_profiles.id)
  ↓ convertLeadCrm (admin, customers.create)
customer_profiles ←→ users (auth)
  ↓ proposals (customerId, optional leadId)
proposals
  ↓ payments (Razorpay)
payments
  ↓ project creation rules (workflow / admin)
projects (customerId, leadId optional)
```

**Entities:** Single `leads` table for both contact and start-project intake (differentiated by `pageSource`, `source`, intake metadata). **No duplicate lead tables.**

---

## 3. Lead lifecycle

**Statuses (`lead_status` enum):** `new` → `contacted` → `qualified` → `discovery` → `proposal` → `negotiation` → `won` | `lost` | `archived`.

**Pipeline UI:** `CRM_PIPELINE_STATUSES` in `server/lib/crm/constants.ts` (excludes `archived` from kanban).

**Transitions (MASTER 05 hardening):** `server/lib/crm/lead-lifecycle.ts` — `canTransitionLeadStatus()` enforced in `updateLeadCrm()`. Blocks skips (e.g. `new` → `won`). Post-conversion status changes blocked when `convertedAt` is set.

**Who changes status:** Users with `leads.update`; assignment changes need `leads.assign` + admin CRM accessor for assignee changes.

**Convert eligibility:** `proposal`, `negotiation`, or `won` via `isLeadEligibleForConversion()`.

---

## 4. Lead sources

| Source | Mechanism |
|--------|-----------|
| Website contact | `createLeadFromWebsite`, `source` normalized (e.g. `website_contact`) |
| Start project | Authenticated intake → lead with `PROJECT_INTAKE_PAGE_SOURCE` |
| Manual CRM | `POST /api/v1/admin/leads` |
| Attribution | UTM, `landingPath`, `pageSource`, geo fields |

Careers and freelancer applications use **separate** tables/workflows (not merged into sales leads).

---

## 5. Public lead capture

- **Validation:** `createLeadSchema` (Zod) — no `status`, `customerId`, or `assignedEmployeeId` fields.
- **Honeypot:** `website` field on `POST /leads` → silent accept (anti-spam).
- **Rate limit:** `LEAD_RATE_LIMIT_*` on public leads route.
- **Re-inquiry:** Open lead same email → interaction + update, not duplicate row (`findLatestOpenLeadByEmail`).
- **Duplicate hints:** `possibleDuplicateOf` + `findDuplicateHints` (email → lead/customer).

---

## 6. Contact vs start project

| Path | Audience | Entry | CRM |
|------|----------|-------|-----|
| `/contact` | Anonymous | `POST /api/v1/leads` | New or re-inquiry lead |
| `/start-project` | Customer session | `project-intake` API | Lead tied to `customerId`, rich intake metadata |

MASTER 02 separation preserved; both appear in CRM with channel badges (`CrmStartProjectLeadPanel`).

---

## 7. Deduplication

- Email-based open lead reuse for website.
- `possibleDuplicateOf` flag on create.
- Convert flow: if customer exists → `requiresConfirmation` + `linkExistingCustomerId` (no silent duplicate customer).

---

## 8. Qualification

Deterministic fields on `leads`: `serviceInterest`, `budget`, `timeline`, `qualificationBusinessType`, `qualificationProjectSize`, `qualificationUrgency`, `qualificationDecisionMaker`, `estimatedValue`, `expectedCloseAt`, `salesNextAction`. Moving to `qualified` requires service + at least one qualification signal (`assertQualifiedFields`).

**No AI scores.**

---

## 9–10. CRM admin UX & lead detail

- **Home:** metrics, follow-up queue, pipeline columns (`CrmHomePage`).
- **List / filters:** status, source, service, follow-up, search (`listLeadsCrm`).
- **Detail:** identity, intake panel, sales actions, activity timeline, linked proposal/project panels (`CrmLeadDetailPage`).

Aligned with MASTER 01 portal patterns (surfaces, typography, `PageIntro`).

---

## 11. Lead ownership

- `assignedEmployeeId` → `employee_profiles`.
- `assertCanAccessLead`: admins with full CRM access see all; employees only assigned leads.
- Assign: `POST /leads/:id/assign`, permission `leads.assign`.

---

## 12. Lead notes

- `lead_notes` table; `addLeadNoteCrm` — admin/authorized only.
- Not exposed on public or customer APIs.

---

## 13. Activity timeline

- `lead_activities` (`recordLeadActivity`): created, status_changed, note_added, converted, follow_up, interactions, etc.
- `GET /leads/:id/activity` + `CrmActivityTimeline` UI.
- `audit_logs` on website create / re-inquiry.

---

## 14–15. Lead → customer conversion

**API:** `POST /api/v1/admin/leads/:id/convert` (`customers.create`, admin CRM accessor only).

**Flow:** `convertLeadCrm` → duplicate check → `inviteCustomerFromLead` (Supabase invite) or link existing → set `customerId`, `convertedAt`, status `won`.

**MASTER 05 improvements:**

- **Idempotent** return when `customerId` + `convertedAt` already set (`alreadyConverted`).
- **Eligibility** via `isLeadEligibleForConversion()`.
- **Status lock** after conversion.

---

## 16–17. Customer account & portal

- `customer_profiles` linked to `users` after invite/sign-up.
- Portal: `/app` via MASTER 04 auth; project requests scoped by `customerId` from session (not query params).

---

## 18–20. Proposal, payment, project handoff

- **Proposal:** `POST /leads/:id/create-proposal`, fulfillment services; CRM shows `CrmProposalFulfillmentPanel`.
- **Payment:** `proposal-payment.service.ts`, Razorpay; webhook verification in `security-audit.test.ts`.
- **Project:** `POST /leads/:id/create-project`, `workflow.service` / `project-delivery` transitions.

CRM references entities by ID; does not duplicate commercial data.

---

## 21. Traceability

Lead detail surfaces related customer, proposal, and project when present. Admin search includes leads (`adminSearch`).

---

## 22–25. Security & RBAC

| Check | Result |
|-------|--------|
| Customer → CRM/leads | **DENY** (no admin portal; no leads API) |
| Freelancer → CRM | **DENY** (no leads permissions in defaults) |
| Employee | **Scoped** — assigned leads only unless full admin CRM |
| Convert | **Admin only** (`isFullCrmAccessor`) |
| Public POST body | **Stripped** internal fields (test added) |

Live IDOR matrix: **BLOCKED** (no DB/auth).

---

## 26. Status transitions

Implemented in `lead-lifecycle.ts` + `updateLeadCrm`. Illegal transitions → 400.

---

## 27–28. Notifications & audit

- `notifyAdminsOfNewLead` → `notifications` for FOUNDER/ADMIN/SUPER_ADMIN.
- Audit/actions as above; no second audit system.

---

## 29–30. API security

- All CRM mutations: `authenticate` + permissions + `assertCanAccessLead`.
- Public leads: validation + rate limit + honeypot.
- Unauthenticated gate tests: `server/security/auth-gate.live.test.ts`.

---

## 31–35. CRM UX / responsive / search / filters

Audited in code: responsive CRM CSS modules, filter query params, `ilike` search on name/email/company. **Live responsive browser pass on admin CRM:** **BLOCKED** (no admin session).

Public `/contact` loads on preview build (**PASS** title/H1 via prior masters).

---

## 36–38. Integrity & atomicity

- FKs: `leads.customerId`, `projects.leadId`, proposals customer linkage.
- Convert uses sequential DB steps; idempotent path reduces double-convert risk.
- Full transaction wrapper not added (existing pattern); documented limitation.

---

## 39. Tests

| Added / updated | Purpose |
|-----------------|---------|
| `server/lib/crm/lead-lifecycle.test.ts` | Status transitions + convert eligibility |
| `server/lib/validation/leads.test.ts` | Public schema rejects CRM control fields |
| Existing | `crm-access.test.ts`, lead channel/intake tests, payment/project transition tests |

**Run:** `386 passed`, `2 skipped` (auth gate tokens).

---

## 40–41. Build / lint

| Gate | Result |
|------|--------|
| `npm run lint` | 0 issues |
| `npm run build` | Pass |

---

## 42. End-to-end business flow

| Step | Status |
|------|--------|
| Visitor → contact/start-project | **BLOCKED** (no API+DB) |
| Lead in admin CRM | **BLOCKED** |
| Qualify → convert → proposal → pay → project | **BLOCKED** |

---

## 43–44. Regression

Masters 01–04 architecture unchanged except targeted CRM hardening. Freelancer 4.16–4.22 paths untouched.

---

## 45. Fixes made (this master)

1. **Lead status transition matrix** — `lead-lifecycle.ts` + enforcement in `updateLeadCrm`.
2. **Post-conversion status lock** — cannot change status after `convertedAt`.
3. **Convert idempotency** — safe re-call when already converted.
4. **Public lead schema test** — documents non-acceptance of client CRM fields.

---

## 46. Blocked items

1. `DATABASE_URL` + migrations + seed.
2. Supabase (`VITE_*` + service role) for invite/login.
3. Admin test session for CRM browser QA.
4. Razorpay test keys for payment isolation proof.
5. Pairwise customer IDOR on proposals/files/messages (MASTER 04.1).

---

## 47. Remaining limitations

- E2E revenue pipeline proof requires staging (see MASTER 04.1 env checklist).
- Lead convert could be wrapped in explicit DB transaction in a future hardening pass.
- Employee convert remains disabled by design (admin-only).

---

## 48. Final security matrix (live)

| Capability | PUBLIC | CUSTOMER | EMPLOYEE | FREELANCER | ADMIN |
|------------|--------|----------|----------|------------|-------|
| Submit enquiry | ALLOW* | ALLOW* | — | — | — |
| View CRM leads | DENY | DENY | SCOPED** | DENY | ALLOW*** |
| Convert lead | DENY | DENY | DENY | DENY | ALLOW*** |
| View own proposals/payments | — | ALLOW**** | — | — | ALLOW*** |

\* Via public/authenticated intake APIs only.  
\** Assigned leads + `leads.view`.  
\*** With permissions.  
\**** Session-scoped customer APIs.

---

## 49. Final readiness

**MASTER 05 COMPLETE** criteria requiring live DB/auth/payment E2E are **not met**.

**MASTER 05 — READY WITH LIMITATIONS:** architecture audited, pipeline coherent in code, public capture hardened, transitions and conversion safety improved, tests green. **Complete** when staging runs full §42 flow and IDOR checks from MASTER 04.1.
