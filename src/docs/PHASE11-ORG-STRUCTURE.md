# Phase 11 — Organizational structure

## Departments (reference slugs)

See `server/lib/org/departments.ts` — management, engineering, design, product, sales, marketing, customer_success, support, finance, people.

**No department rows are seeded.** Assign on employee invite or via org PATCH.

## Roles (database)

`CUSTOMER`, `EMPLOYEE`, `ADMIN`, `SUPER_ADMIN`, `FOUNDER` — no MANAGER/TEAM_LEAD role explosion.

Future leads use **permissions** + `manager_employee_id`, not new role types.

## Growth stages (inferred from active employee count)

| Stage | Approx. team size |
|-------|-------------------|
| stage_1_founder_led | ≤1 |
| stage_2_core_team | ≤8 |
| stage_3_department_leads | ≤25 |
| stage_4_management | ≤60 |
| stage_5_multi_team | 60+ |

Shown on Executive dashboard — informational only.

## Employee lifecycle

| User status (auth) | Employment state |
|--------------------|------------------|
| invited | onboarding (on invite) |
| active | active (manual / process) |
| suspended | active or on_leave (manual) |
| disabled / inactive | offboarded (automatic on disable) |

## Hiring

**External:** job descriptions, interviews, offers, employment contracts, statutory registrations.

**In-app:** invite employee only when a real hire is approved.

## Office

**No office entity in the database.** Remote/hybrid/physical office is a Founder business decision — see `PHASE11-INFRASTRUCTURE-DR.md`.
