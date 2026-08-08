# Phase 3 — SEO inventory (pre-implementation baseline)

**Date:** 2026-08-09

## Indexable public URLs (post–Phase 3)

| Path | Primary intent |
|------|----------------|
| `/` | Brand + commercial hub |
| `/services` | Service discovery |
| `/services/*` | Commercial service detail (10 slugs) |
| `/work` | Portfolio hub |
| `/work/*` | Project detail (labeled internal/concept) |
| `/erode` | Local commercial (Erode / TN) |
| `/about` | Trust / entity |
| `/pricing` | Commercial + informational pricing |
| `/contact` | Transactional |
| Legal | `/privacy-policy`, `/terms`, `/cookie-policy` |

## Noindex (thin or app)

| Path | Reason |
|------|--------|
| `/insights` | No published articles yet |
| `/solutions` | Placeholder hub |
| `/auth/*`, portals, `/team/sign-in` | App / auth |
| `/404` | Error |

## Technical baseline

- **Canonical:** `PageMeta` sets canonical from path (query params excluded).
- **Sitemap / robots:** Generated via `scripts/generate-seo.mjs` — keep aligned with `indexable-routes.ts`.
- **Schema:** Organization, WebSite, LocalBusiness/ProfessionalService (home + Erode), Service (detail), FAQ (home, pricing, services, Erode), Breadcrumb (key hubs), Person (founder on About).
- **GSC:** `VITE_GSC_VERIFICATION` supported in `PageMeta` when set in env.

## Keyword map

See `src/config/seo-keyword-map.ts`.

## Cannibalization guardrails

- Local Erode queries → `/erode`, not duplicated on every service title.
- SaaS/CRM → `/services/software-development` until a dedicated page is justified.
- Insights/solutions excluded from index until substantive content ships.
