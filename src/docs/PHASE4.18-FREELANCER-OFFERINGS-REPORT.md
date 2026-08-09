# Phase 4.18 — Freelancer Services, Skills & Base Pricing

## Readiness

**READY WITH LIMITATIONS** — `npm run build` and `npm run lint` pass; tests run with `npx vitest run --pool=threads --maxWorkers=2`. Browser E2E: **not performed**.

---

## 1. Audit findings

- **Freelancer identity**: `freelancer_profiles` (4.16) with text `skills` + JSON `service_categories` — kept; structured offerings are additive.
- **Canonical services**: `INTAKE_SERVICE_SLUGS` / Start Project catalog (`server/lib/intake/service-slugs.ts`) — reused as `service_slug` FK-by-convention (no duplicate DB catalog).
- **Sub-services / skills**: Derived from public `services-catalog` “delivers” lists in code (`muco-service-catalog.ts`) — no DB seeds.
- **4.17** `project_freelancers` unchanged.
- **Customer/proposal pricing**: separate; not exposed to customers in this phase.
- **No existing** `freelancer_services` tables — migration required.

## 2. Architecture decision

- **MUCO canonical service** → **freelancer offering** rows (`freelancer_services`).
- **Catalog sub-offerings** → **freelancer skills** (`freelancer_skills`) and optional `sub_service_slug` on offerings.
- **freelancerBasePrice** fields on offerings only; no MUCO customer price or markup engine.

## 3–5. Services, skills, pricing

- Services: slug, optional sub-service, description, experience, pricing type, base/min price, currency, active flag.
- Skills: service slug + skill slug (catalog), unique per freelancer.
- Pricing types: `fixed`, `starting_from`, `hourly`, `per_project`, `custom_quote`; validated server-side; currencies via `SUPPORTED_PROPOSAL_CURRENCIES`.

## 6. Database

- `server/db/migrations/0027_freelancer_services_skills.sql`
- `freelancer_services`, `freelancer_skills`, enum `freelancer_pricing_type`
- Unique partial indexes for general vs sub-service offerings.

## 7. API

**Freelancer**: `GET /services/catalog`, CRUD `/services`, `GET/POST/DELETE /skills`  
**Admin**: `GET /freelancers/:id/services|skills`, `PATCH /freelancers/:id/services/:serviceId`

## 8–9. UX

- Freelancer: **My services**, **My skills** (nav + pages).
- Admin freelancer detail: services/base pricing review, skill list, toggle active.

## 10. Authorization / security

- Ownership via `requireFreelancerContext` + row `freelancer_id`.
- Active offerings only when `approvalStatus === 'approved'`; deactivation on approval loss (dynamic import from offerings service).
- Admin: `freelancers.view` / `freelancers.manage`.

## 11–12. Notifications / audit

- No notifications for self-service.
- Audit: `freelancer.service_*`, `freelancer.skill_*`, `freelancer.service_disabled`.

## 13. Tests

- `server/lib/freelancers/freelancer-offerings.test.ts` — catalog, pricing, eligibility, RBAC, customer DTO.

## 14–17. Results

Run locally: `npx vitest run --pool=threads --maxWorkers=2`, `npm run build`, `npm run lint`.

## 18–20. Limitations / not implemented

- No marketplace, customer visibility, markup engine, payouts, matching, or fake seed data.
- IDOR covered by service-layer ownership (unit tests for validation/RBAC; no full DB integration suite).

## 21. Readiness

**READY WITH LIMITATIONS** when build/lint/tests pass.
