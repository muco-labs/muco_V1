# Phase 4 — Lead generation engine (final report)

## 1. Existing lead architecture

Public intake: `InquiryForm` → `submitContact` → `POST /api/v1/leads` → `createLeadFromWebsite`. CRM/admin/employee APIs unchanged in auth model. Data in `leads` + notes, activities, interactions, proposals.

## 2. Lead lifecycle

Enum: `new` → `contacted` → `qualified` → `discovery` → `proposal` → `negotiation` → `won` | `lost` | `archived`. Pipeline board uses `CRM_PIPELINE_STATUSES` (excludes `archived`).

## 3. Lead sources

Normalized via `normalizeLeadSource` → `WEBSITE`, `ORGANIC_SEARCH`, `REFERRAL`, `SOCIAL`, `CAMPAIGN`, `EMAIL`, `DIRECT`, `MANUAL`, `OTHER`. `website_contact_*` slugs map to `WEBSITE`.

## 4. Attribution

Columns (migration `0008`): `landing_path`, `utm_*`, `referrer_host`, `page_source`. Client sends structured payload from `attributionPayloadForLead`; message footer context retained for backward compatibility.

## 5. Lead data model

Core fields unchanged; attribution columns added. Service/budget/timeline from form; priority/assignment/follow-up/qualification fields already present.

## 6. Deduplication

- New row: `possibleDuplicateOf` when email matches any prior lead (closed or open).
- Open lead (not won/lost/archived) + same email: **re-inquiry** — interaction + `lead.re_inquiry` activity, no duplicate row.

## 7. Website lead capture

Single `InquiryForm` + `contactHref` CTAs across marketing pages.

## 8. Service attribution

`pageSource` + `serviceInterest` from prefill and service pages.

## 9. Portfolio conversion

Work detail CTAs pass `pageSource` / service prefill (Phase 2 Stage 4).

## 10. Qualification

Existing CRM rules (`assertQualifiedFields`) for status → qualified; no invented numeric score.

## 11. Priority

`high` | `medium` | `low` via existing lead priority enum; admin-editable.

## 12. Assignment

Existing `assignLead` + employee scope in `crm.service`.

## 13. CRM pipeline

Admin CRM home pipeline board + metrics.

## 14. Follow-up

Existing `followUpAt`, `followUpStatus`, scheduling APIs.

## 15. Proposal handoff

Existing proposals linked to leads; convert flow unchanged.

## 16. Lead → customer

Existing `inviteCustomerFromLead` / convert paths unchanged.

## 17. Analytics

Events: `inquiry_started`, `lead_created` (+ existing CTA/form events). Funnel map updated in `funnel.ts`.

## 18. Funnel

Stages through `crm_lead` for `lead_created`; CRM stages remain in-database only.

## 19–20. Service demand & source performance

`getCrmMetrics` returns `byService` and `bySource`; CRM home lists when data exists.

## 21. Erode readiness

`/erode` landing + optional company field; no geo inference.

## 22. Landing-page readiness

Attribution + `page_source` support high-intent pages without mass city pages.

## 23–24. Spam & security

Rate limit, honeypot, Zod; CRM IDOR patterns preserved in existing tests.

## 25. Privacy

Inquiry form links to privacy policy; minimal fields.

## 26–29. QA dimensions

Manual: mobile form journey recommended. Build/lint/test automated below.

## 30–33. Validation

- TypeScript: pass (`npm run build`)
- Lint: pass (existing warnings only)
- Tests: 45/45 pass
- Build: pass

## 34–35. Git

See commit output after push.

## 36. External configuration

- Run `npm run db:migrate` on environments using Postgres (applies `0008_lead_attribution.sql`).
- Resend: `inquiry_confirmation` + admin notifications require env keys already documented for Phase 2+.
- GA4: ensure `inquiry_started` / `lead_created` are registered in GA if reporting on them.
