# Phase 6 — Sales audit

## Model

- **Opportunity** = qualified lead in CRM (`qualified` → `negotiation` statuses).
- **Pipeline** = existing `lead_status` + proposals + payments.
- No separate opportunity table (avoids duplicate records).

## Gaps addressed

- Opportunity fields on leads: estimated value, expected close, sales next action, referral source.
- Proposal line items, discounts (admin-approved), payment schedule, send approval for non-admins.
- `recurring_agreements` table for retainer tracking (no auto-billing).
- Sales & revenue dashboards from real aggregates.
- Communication templates (editable constants, transactional only).

## Not in Phase 6

- Paid ads, outbound campaigns, WhatsApp automation, fake urgency, auto marketing email.
