# Phase 4.16 — Freelancer Network Foundation

## Architecture decision

Dedicated `freelancer_profiles` + `freelancer_internal_notes` (not employee profiles, not careers applications). `FREELANCER` RBAC role with separate `freelancer` portal. Auth via existing Supabase/users; optional `user_id` link on approval/login.

## Status model

- **Verification:** `pending` | `verified` | `failed`
- **Approval:** `under_review` | `approved` | `rejected` | `suspended`
- **Availability:** `available` | `unavailable` (freelancer-controlled only when verified + approved)

## APIs

- Public: `GET /api/v1/freelancers/service-categories`, `POST /api/v1/freelancers/apply`
- Freelancer: `GET /dashboard`, `GET|PATCH /profile`, `PATCH /availability`
- Admin: `GET|PATCH /api/v1/admin/freelancers`, notes `GET|POST .../notes`

## Migration

`0025_freelancer_network.sql`

## Limitations

No assignments, wallet, payouts, public directory, email automation, or KYC uploads. Portal requires approved profile + `FREELANCER` role.

## Readiness

**READY WITH LIMITATIONS**
