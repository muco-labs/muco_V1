# Phase 4 — Lead generation audit (pre-implementation baseline)

## Intake surfaces

| Surface | Mechanism |
|--------|-----------|
| Contact / inquiry form | `InquiryForm` → `submitContact` → `POST /api/v1/leads` |
| Service / portfolio / pricing CTAs | `contactHref` + `pageSource` prefill → same form |
| Admin manual entry | Admin CRM (existing) |

## Storage

- Table: `leads` (Drizzle schema in `server/db/schema.ts`)
- Related: `lead_notes`, `lead_activities`, `lead_interactions`, `proposals`, `audit_logs`

## Lifecycle (existing enum)

`new` → `contacted` → `qualified` → `discovery` → `proposal` → `negotiation` → `won` | `lost` | `archived`

Pipeline UI: `CRM_PIPELINE_STATUSES` in admin CRM home.

## Gaps addressed in Phase 4

1. UTM / landing / page context stored in dedicated columns (`0008_lead_attribution.sql`), not only message footer.
2. Re-inquiry: open lead (not won/lost/archived) with same email records interaction + activity instead of duplicate row.
3. CRM metrics: `byService` and `bySource` from real aggregates.
4. Analytics: `inquiry_started`, `lead_created` funnel events.
5. Form privacy note linking to `/privacy-policy`.

## Security (unchanged principles)

- Public lead POST: rate limit, honeypot, Zod validation.
- CRM routes: server-side `assertCanAccessLead` / role scopes.
- No secrets in browser; admin notify via in-app notifications + optional Resend.

## Out of scope (Phase 4)

Marketing automation, paid ads, referral rewards, mass landing pages, automatic marketing email.
