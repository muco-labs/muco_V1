# Phase 3 — SEO master report

**Date:** 2026-08-09  
**Scope:** Public marketing site technical + on-page SEO (no paid ads, no GBP dashboard work, no backlink campaigns).

---

## 1. Health assessment

**Overall:** Strong technical baseline (canonical, sitemap, robots, structured data, portal noindex). Phase 3 adds local landing, indexation hygiene, richer metadata/schema, and measurement hooks. **Live rankings not claimed** — validate in Search Console after deploy.

## 2. Technical SEO

- Canonical per page via `PageMeta` (path-only; strips tracking query params from canonical).
- `lang="en-IN"` on HTML shell; `og:locale` on pages.
- GSC verification meta when `VITE_GSC_VERIFICATION` is set.
- Sitemap: 28 URLs (`generate-seo.mjs` + `indexable-routes.ts`).

## 3. Indexation strategy

**Index:** home, services (+10 detail), work (+8 projects), `/erode`, about, pricing, contact, legal.  
**Noindex:** insights, solutions (thin), auth/portals/404.  
**Robots disallow:** `/app/`, `/admin/`, `/employee/`, `/customer/`, `/auth/`, `/team/`.

## 4–6. URL / keyword architecture

Stable slugs under `/services/{slug}`, `/work/{id}`, single local URL `/erode`.  
Keyword clusters → primary URLs: `src/config/seo-keyword-map.ts`.  
Cannibalization: local queries → `/erode`; SaaS/CRM → software-development until dedicated page justified.

## 7. Homepage SEO

Title/description aligned with Erode + commercial positioning (`site.defaultTitle`). FAQ `FAQPage` JSON-LD on home (visible FAQ section). Organization + WebSite + LocalBusiness schema.

## 8–10. Titles, descriptions, headings

Unique `pageSeo` + `getServiceSeo` + `getWorkProjectSeo`. One H1 per template. Insights/solutions noindex.

## 11–12. Service SEO

Existing depth (problem, solution, builds, FAQ, related work). Distinct copy per slug in `service-content.ts` — avoid template swapping only.

## 13–15. Local (Erode / TN)

New **`/erode`** landing: services links, FAQs, LocalBusiness + FAQ schema, verified address locality (no street invented). TN/national coverage in prose — no city spam pages.

## 16–17. India / international

National intent on service pages; international via company copy — no fake country URLs.

## 18–19. Content clusters

**Future:** insights articles when published (auto-index when `insightArticles` populated). Planned clusters documented in inventory — not mass-published in Phase 3.

## 20. Founder / entity

`PersonSchema` on About (`#founder`). Organization `founder` + `contactPoint` in JSON-LD.

## 21–25. Schema

Organization, WebSite, ProfessionalService (home/Erode), Service (detail), FAQ (home/pricing/service/Erode), Breadcrumb (about/services/work), Person (founder). No fabricated `sameAs` (empty GitHub omitted).

## 26–28. Canonical, sitemap, robots

Implemented; production domain `https://mucolabs.com` via `VITE_SITE_URL`.

## 29–30. Open Graph / social

OG + Twitter tags in `PageMeta`; `@muco_labs` on twitter:site.

## 31. Image SEO

Project/hero use alt text patterns; portfolio placeholders labeled. Further asset filenames when real screenshots ship.

## 32–33. Internal linking

Footer **Erode** link; service ↔ work; Erode ↔ services; pricing/contact CTAs unchanged from Phase 2.

## 34–35. Broken links / redirects

No new redirect chains; run periodic link check in CI optional.

## 36–37. Performance / JS SEO

No heavy SEO plugins; SPA with prerender shell in `index.html` + client meta update. Critical text in DOM after render.

## 38. Structured data validation

Manually verify with [Google Rich Results Test](https://search.google.com/test/rich-results) post-deploy.

## 39. Search Console readiness

Sitemap URL in robots; verification env supported — **owner must verify domain in GSC**.

## 40. Analytics

`organic_landing` once per session from search referrers; existing funnel events preserved.

## 41–42. Conversion + E-E-A-T

Phase 2 CTAs retained; real founder, labeled portfolio, verified contact.

## 43–48. Freshness, competitors, cannibalization, thin/duplicate

Solutions/insights noindex; keyword map prevents duplicate local targets.

## 49–50. Mobile + accessibility

Existing responsive layout; semantic headings maintained.

## 51. Implemented changes (summary)

- `/erode` page + route + sitemap  
- `seo-keyword-map.ts`, `getWorkProjectSeo`  
- noindex insights/solutions; drop from sitemap  
- robots `/team/`  
- Home FAQ schema; breadcrumbs; Person schema  
- Organization contactPoint; PageMeta locale/twitter  
- `organic_landing` event  
- Docs: `PHASE3-SEO-INVENTORY.md`

## 52–53. Quality gate & testing

TypeScript, lint, build, 44 tests pass.

## 54. Success measurement (external)

Track in GSC + GA4: impressions, clicks, CTR, indexed pages, organic landing → inquiry → CRM lead → revenue. **Not measurable inside this repo alone.**

## Remaining external actions

1. Verify domain in Google Search Console; submit sitemap.  
2. Set `VITE_GSC_VERIFICATION` on Vercel when token available.  
3. Publish first insights articles when ready (re-add to indexable list).  
4. Competitor/SERP research with real keyword tools.  
5. GBP / backlinks / ads — **out of Phase 3 scope**.

## Remaining content opportunities

- Pillar articles (website cost, process) linking to services  
- Client portfolio entries when verified  
- Service-specific OG images (optional)
