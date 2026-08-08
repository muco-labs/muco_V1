# Phase 2 / Stage 4 — Conversion audit

**Date:** 2026-08-09  
**Scope:** Public marketing funnel + inquiry → CRM (no backend redesign).

## Problems found (pre-Stage 4)

| Area | Issue |
|------|--------|
| Hero | Secondary CTA pointed to Services, not Work; value prop split across two sentences |
| Contact | Short form; no service/budget/timeline for CRM qualification |
| Contact | Uncontrolled form reset on error; limited success state |
| Service detail | No related portfolio; weak path to pricing |
| Portfolio detail | Generic CTA copy for concepts vs internal builds |
| Attribution | UTM capture existed but was not wired on navigation |
| Pricing | Tier CTAs were plain links without tracking or “what’s next” |
| Mobile | No persistent primary CTA outside contact |

## Implemented

- **InquiryForm** — qualification fields → existing `POST /api/v1/leads` schema
- **contactHref** — `?service=&source=&project=` prefill
- **StickyStartCta** — hidden on `/contact` and `/auth/*`
- **Analytics** — `hero_cta_click`, `service_cta_click`, `portfolio_cta_click` + attribution capture
- **Funnel** — unchanged stage map in `lib/analytics/funnel.ts`

## Not done (by design)

- Popups, exit intent, fake urgency
- Lead scoring UI
- A/B tests in production
- SEO master / paid ads
