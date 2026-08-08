# Phase 8 — India expansion report

## Summary

Phase 8 scales **Erode → Tamil Nadu → India** with two regional hubs, an indexable **solutions** program (5 industries), voluntary **state** on leads, CRM **`india`** locality filter, and **Admin → India market** dashboard. No per-city doorway pages or fabricated presence.

## Deliverables (§56 map)

| Area | Implementation |
|------|----------------|
| Hubs | `/tamil-nadu`, `/india` |
| Industry pages | `/solutions` + 5 slugs |
| Service architecture | Unchanged national `/services/*` |
| Attribution | `business_state`, hub paths, page sources |
| CRM | `locality=india\|tamil_nadu\|erode` |
| Admin | `/admin/local/india` national dashboard |
| SEO | Sitemap + indexable routes; solutions indexable |
| Docs | `PHASE8-INDIA-MARKET-AUDIT.md` |

## Migration

Run `npm run db:migrate` for `0011_lead_business_state.sql`.

## Validation

`npm run lint`, `npm test`, `npm run build` — record in release notes.

## Stop

Phase 9+ (global, SaaS products, offices, ads) not started.
