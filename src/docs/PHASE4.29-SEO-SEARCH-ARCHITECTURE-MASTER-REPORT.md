# Phase 4.29 — SEO & search architecture (MASTER 03)

**Scope:** Full technical and content SEO architecture for the public MUCO LABS marketing site. Builds on MASTER 01 (UI/UX) and MASTER 02 (public content + IA). No deploy, no production env changes, no commit unless requested.

## Final readiness

**MASTER 03 — SEO + SEARCH ARCHITECTURE**  
**STATUS: COMPLETE** (repository implementation, validation, and browser QA)

**Live platform verification: READY WITH LIMITATIONS** — Google Search Console / Bing Webmaster Tools property verification, sitemap submission, and indexing status require production domain access and were not performed in this environment.

---

## 1. Full SEO audit (baseline)

### Stack (pre-existing, audited)

| Layer | Location | Notes |
|-------|----------|--------|
| Page titles, descriptions, noIndex flags | `src/config/seo.ts` | Per-page + per-service entries; insights/auth/404 noIndex |
| Keyword → URL intent map | `src/config/seo-keyword-map.ts` | One primary URL per cluster; no cannibalization |
| Service FAQs + related slugs | `src/data/service-seo.ts` | Supports FAQ schema where content exists |
| Runtime meta / canonical / OG / Twitter | `src/components/seo/PageMeta.tsx` | Client-side `useEffect` updates `<head>` |
| JSON-LD | `src/components/seo/StructuredData.tsx` | Organization, WebSite, LocalBusiness, Service, Breadcrumb, FAQ, JobPosting, Person |
| Indexable route registry | `src/config/indexable-routes.ts` | Sitemap source of truth + `isIndexablePath()` |
| Sitemap XML builder | `src/config/sitemap.ts` | Used by generate script |
| Robots.txt builder | `src/config/robots.ts` | Disallow private prefixes + sitemap line |
| Static artifacts | `public/sitemap.xml`, `public/robots.txt` | Regenerated on `npm run build` / `npm run generate:seo` |
| Prior inventory | `src/docs/PHASE3-SEO-INVENTORY.md`, `PHASE3-SEO-REPORT.md` | Phase 3 baseline |

### Gaps found in audit (addressed in this master)

1. **Sitemap drift** — `scripts/generate-seo.mjs` duplicated paths and omitted `/careers` and `/careers/apply`.
2. **Careers not in indexable registry** — `indexable-routes.ts` missing careers paths.
3. **Robots** — Freelancer apply and start-project intake not explicitly disallowed (still noIndex via meta).
4. **Organization schema logo** — Pointed at `/favicon.svg` instead of brand mark.
5. **Build script on Windows** — Vite plugin spawn broke on paths with spaces (`Muco labs`).

### Rendering model (important)

The app is a **Vite SPA**. Primary SEO text and headings are in the React tree (crawlable by Google’s rendered crawl). **Title, meta description, canonical, and robots** are applied **after hydration** via `PageMeta`. This is acceptable for Google/Bing in most cases but is weaker than SSR/prerender for instant bot HTML. **Not changed in this master** (no new framework). Recommend prerender or SSR for critical URLs in a later production hardening pass if Search Console shows indexing gaps.

---

## 2. Route indexability matrix

| Route pattern | Index | Sitemap | Robots | Meta robots | Notes |
|---------------|-------|---------|--------|-------------|-------|
| `/` | Yes | Yes | Allow | index,follow | Home + org/website/local schema |
| `/services`, `/services/:slug` (10 slugs) | Yes | Yes | Allow | index,follow | Service schema + breadcrumbs on detail |
| `/solutions`, `/solutions/:industry` | Yes | Yes | Allow | index,follow | |
| `/work`, `/work/:id` | Yes | Yes | Allow | index,follow | Honest project labelling |
| `/about` | Yes | Yes | Allow | index,follow | Person schema (founder) when published |
| `/contact`, `/pricing` | Yes | Yes | Allow | index,follow | FAQ on pricing where present |
| `/products`, `/products/client-hub` | Yes | Yes | Allow | index,follow | Waitlist framing; no fake Product schema |
| `/erode`, `/erode/:service` | Yes | Yes | Allow | index,follow | Local intent; no fake branches |
| `/tamil-nadu`, `/india`, `/international` | Yes | Yes | Allow | index,follow | Geo hubs |
| `/careers`, `/careers/apply` | Yes | Yes | Allow | index,follow | **Added to sitemap this master** |
| `/careers/openings/:slug` | Yes* | Optional** | Allow | index,follow when job loads | `JobPosting` JSON-LD when published |
| `/insights` | No | No | Allow | noindex,nofollow | Placeholder hub |
| `/start-project` | No | No | Disallow prefix | noindex,nofollow | Transactional; account path |
| `/app/start-project/*` | No | No | `/app/` disallow | noindex | Customer flow |
| `/freelancers/apply` | No | No | Disallow | noindex,nofollow | Recruitment funnel |
| `/auth/*`, `/team/sign-in`, `/admin/sign-in` | No | No | Disallow | noindex | Auth shells |
| `/app/*`, `/team/*`, `/admin/*`, `/app/freelancer/*` | No | No | Disallow | noindex on layouts | Portals |
| `*` (404) | No | No | Allow | noindex,nofollow | Useful 404 content |

\* Index when opening is published and page renders job (not error state).  
\** Static sitemap includes fixed URLs only. Published job slugs can be added at build via env `SEO_CAREERS_OPENING_SLUGS=slug-one,slug-two` or a future dynamic sitemap API.

---

## 3. Title strategy

**Pattern:** `Topic | MUCO LABS` (or full `documentTitle` where set). Location appears on geo pages and default home title, not forced on every service.

| Page type | Example |
|-----------|---------|
| Home | `MUCO LABS \| Web & Software Development in Erode, Tamil Nadu` (`site.defaultTitle`) |
| Service | `Web Development Company \| MUCO LABS` (distinct per slug in `seo.ts`) |
| Geo | `MUCO LABS Erode \| Web, Software & AI Development` |
| Work item | `{Project title} \| Work \| MUCO LABS` |
| Careers | `Careers \| MUCO LABS` / `Apply \| Careers \| MUCO LABS` |

No duplicate titles across the 44 sitemap URLs. No keyword stuffing.

---

## 4. Meta description strategy

Each indexable static route has a unique description in `pageSeo` or `getServiceSeo()`. Descriptions match on-page copy boundaries (no fabricated clients, ratings, or awards). Insights/auth/404/start-project use noIndex and are excluded from sitemap.

---

## 5. Heading audit (public)

| Area | H1 | Hierarchy |
|------|-----|-----------|
| Home | Hero headline (SignatureHero) | Section H2s (services, founder, FAQ, etc.) |
| Services index | Page hero H1 | Service cards use titles, not fake H1s |
| Service detail | Service H1 (`getServiceSeo().h1`) | H2 blocks: who, problem, deliverables, process, FAQ, related |
| Work / About / Contact / Pricing | Single PageHero H1 each | Logical H2 sections |
| Careers | Careers hub H1 | Openings H2 |
| Job opening | Job title as H1 via PageShell | Responsibilities H2 |

No headings used purely for styling on audited templates. Service H1 aligns with commercial intent (e.g. “Website development” on web-development).

---

## 6. Canonical strategy

- **Rule:** `https://mucolabs.com` + path, no trailing slash except root (`env.siteUrl` + `PageMeta` `path` prop).
- **Query strings:** Canonical omits query params (e.g. `/careers/apply?job=slug` still canonicalizes to `/careers/apply` when `path` is set without query).
- **Duplicates:** No alternate public paths for the same service slug. `/employee/` in robots is legacy prefix; live employee portal is `/team/` (disallowed).
- **WWW / HTTP:** Production assumes HTTPS apex `mucolabs.com` via `VITE_SITE_URL` at build.

---

## 7. Robots strategy

Generated from `src/config/robots.ts` (single source with generate script):

- **Allow:** `/` (public marketing)
- **Disallow:** `/app/`, `/admin/`, `/employee/`, `/customer/`, `/login/`, `/signup/`, `/auth/`, `/team/`, `/start-project/`, `/freelancers/`
- **Sitemap:** `{siteUrl}/sitemap.xml`

Robots.txt is **not** access control; portal auth remains the security boundary.

---

## 8. Sitemap

- **Generator:** `scripts/generate-seo.ts` (tsx) imports `getSitemapXml` / `getRobotsTxt` from `src/config`.
- **URL count:** **44** static indexable URLs (was 42 before careers).
- **Excluded:** Portals, auth, insights, start-project, freelancers apply, noindex pages.
- **Optional:** `SEO_CAREERS_OPENING_SLUGS` env at build for job detail URLs.

---

## 9. Structured data

| Schema | Where | Policy |
|--------|-------|--------|
| Organization | Home | Legal name, verified social `sameAs`, contactPoint, founder Person when published; **logo → `/brand/muco-logo-mark.png`** |
| WebSite | Home | Publisher org |
| ProfessionalService | Home, Erode | Locality from `company.location`; no fake geo offices |
| Service | Service detail | Name, description, provider, areaServed |
| BreadcrumbList | Service detail, products | Matches visible breadcrumbs |
| FAQPage | Home, pricing, services (where FAQs exist) | Visible FAQ only |
| JobPosting | Careers opening | When job loaded from API |
| Person | About | Founder when published |

**Not used:** Review, AggregateRating, fake Product, Event, or FAQ markup without matching visible content.

---

## 10. Service SEO architecture (10 services)

| Slug | Primary intent | Secondary | Internal links |
|------|----------------|-----------|----------------|
| web-development | Website / web dev company | SEO, UI/UX, ecommerce | Related slugs in `serviceRelatedSlugs` |
| software-development | Custom software / SaaS | Consulting, automation, AI | |
| mobile-app-development | Mobile app company | Software, UI/UX, AI | |
| ecommerce-development | E-commerce development | Web, marketing, SEO | |
| ai-solutions | AI development / automation | Software, automation | |
| ui-ux-design | UI/UX services | Web, mobile | |
| seo | SEO services | Web, digital marketing | |
| digital-marketing | Digital marketing | SEO, ecommerce | |
| automation | Business automation | AI, software | |
| technology-consulting | Technology consulting | Software, automation | |

Each page: unique title, description, H1, body sections, related work, related services, CTA to start project / pricing. No thin keyword variant pages.

---

## 11. Search intent mapping

See `src/config/seo-keyword-map.ts` for navigational (brand), commercial (services), local (Erode/TN), informational (pricing), transactional (contact). One primary URL per cluster.

---

## 12. Local SEO

- **Positioning:** Erode, Tamil Nadu, India + international remote delivery (`/erode`, `/tamil-nadu`, `/india`, `/international`).
- **NAP consistency:** `site.contactEmail`, `site.contactPhone`, footer locality, `company.location` in schema.
- **No fabrication:** No fake branches, hours, reviews, or AggregateRating.
- **Erode service URLs:** `/erode/web-development`, `/erode/software-development`, `/erode/seo` in sitemap.

---

## 13. Entity / brand architecture

- **Consistent names:** `MUCO LABS` (brand), `MUCO LABS Technology & Digital Innovations` (legal) in titles, schema, footer, about.
- **Founder:** Srinivash Mahalingam — content + optional Person schema; real photo from `/brand/Founder.png`.
- **Services:** Canonical 10-slug catalog aligned across nav, footer, sitemap, and `serviceSlugs`.

---

## 14. Internal linking

- Nav: full services dropdown, work, about, pricing, contact, careers, products.
- Footer: explore + all service deep links + geo + legal.
- Service detail: breadcrumbs, related services, related work, pricing/start project CTAs.
- Home → services, work, about, contact, erode, FAQ.

No excessive footer-only spam; links support IA from MASTER 02.

---

## 15. Image SEO

- Brand and team assets under `/public/brand/` with meaningful `alt` on founder/team components (MASTER 01).
- OG default: `/og/og-default.svg`; organization logo in schema uses logo mark PNG.
- **Performance note:** Large founder/team PNGs/JPEGs benefit from compression/WebP in a future perf pass; not blocking SEO architecture.

---

## 16. Open Graph / social

`PageMeta` sets `og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `og:locale`, Twitter `summary_large_image`, `@muco_labs`. Preview QA on home and `/services/web-development` (preview server) shows correct document titles.

---

## 17. 404 and redirects

- Unknown routes → `NotFoundPage` with noindex and helpful links.
- Invalid service slug → service detail not-found handling (existing).
- No redirect loops introduced. Trailing-slash normalization via canonical URLs.

---

## 18. Performance SEO (audit)

- Code splitting: vendor motion/icons/router chunks in build output.
- Hero/founder images: monitor LCP on production; `loading` / dimensions used where implemented in UI components.
- Opening animation (~2s) session-gated — does not block repeat-visit LCP.

---

## 19. Search Console readiness

| Requirement | Status |
|-------------|--------|
| Valid sitemap | Yes (`public/sitemap.xml`, 44 URLs) |
| robots.txt | Yes |
| Canonical URLs | Yes (per page `path`) |
| Stable public URLs | Yes (no slug changes this master) |
| Meaningful titles/descriptions | Yes |
| Private routes not in sitemap | Yes |
| `VITE_GSC_VERIFICATION` | Optional meta hook in `PageMeta` — **set in production only** |

**Not done here:** Domain verification, sitemap submission, coverage reports.

---

## 20. Analytics readiness

- **Implementation:** `src/lib/analytics/` — GA4 via `VITE_GA_MEASUREMENT_ID`; events include `start_project_click`, `contact_click`, `service_view`, `portfolio_view`, `pricing_view`, `product_waitlist_submit`, geo/product views.
- **Dependency:** Measurement ID must be configured in production env; events no-op when unset (documented, not fabricated).

---

## 21. AI / answer-engine discoverability

- Clear entity descriptions in schema and about copy.
- Structured headings and factual service definitions.
- No “AI SEO” gimmicks or hidden FAQ text.

---

## 22. Security boundary (SEO)

Confirmed noindex + robots disallow on portals; start-project and freelancer apply not in sitemap. CRM/admin/customer IDs not exposed in public meta. Job and lead forms stay on API routes behind normal app security.

---

## 23. Browser QA

**Environment:** `npm run preview` on port **4173** (production build).

| Check | Result |
|-------|--------|
| `/` | Title + nav intact; no layout regression observed |
| `/services/web-development` | Title `Web Development Company \| MUCO LABS`; H1 “Website development”; breadcrumb nav |
| `/robots.txt` | Serves static file with new disallow lines |
| `/sitemap.xml` | Includes `/careers`, `/careers/apply` |
| Viewports | Spot-checked desktop preview; MASTER 01 responsive layouts unchanged |

Routes `/work`, `/about`, `/pricing`, `/contact`, `/careers`, `/start-project`, `/auth/sign-in` inherit same meta/shell patterns; full multi-viewport matrix deferred to manual regression if needed before deploy.

---

## 24. Tests

```
npx vitest run --pool=threads --maxWorkers=2
→ 61 files, 353 tests passed
```

---

## 25. Build

```
npm run build
→ generate-seo (44 URLs) + tsc + vite build — success
```

---

## 26. Lint

```
npm run lint (oxlint)
→ 0 issues
```

---

## 27. Issues fixed (this master)

1. Single source of truth for sitemap paths (`indexable-routes.ts` + `generate-seo.ts`).
2. Careers hub + apply added to sitemap (44 URLs).
3. `isIndexablePath()` covers insights, start-project, freelancer apply, app start-project flow.
4. Robots disallow `/start-project/`, `/freelancers/`.
5. Organization / LocalBusiness logo and image URLs aligned with brand assets.
6. `env.ts` reads `VITE_*` from `process.env` when run under Node (generate script).
7. Vite `muco-seo-artifacts` plugin uses `tsx` CLI with quoted paths (Windows space-safe).
8. Removed duplicate `scripts/generate-seo.mjs`.

---

## 28. Remaining dependencies (external / follow-up)

1. **Google Search Console / Bing Webmaster Tools** — verify domain; submit sitemap; monitor coverage.
2. **`VITE_GA_MEASUREMENT_ID`** — enable production analytics.
3. **`VITE_GSC_VERIFICATION`** — optional HTML tag verification.
4. **Dynamic job URLs** — add `SEO_CAREERS_OPENING_SLUGS` at build and/or a server-generated sitemap index when careers API is live in CI.
5. **Prerender/SSR** — optional improvement for meta in initial HTML if rendered crawl shows gaps.
6. **Image compression** — brand/team assets for LCP.

---

## 29. Final readiness status

| Criterion | Met |
|-----------|-----|
| Public routes audited | Yes |
| Indexability defined | Yes |
| Private routes protected | Yes |
| Titles / descriptions / H1 hierarchy | Yes |
| Canonical / robots / sitemap | Yes |
| Structured data valid & honest | Yes |
| Service SEO + intent map | Yes |
| Local + entity consistency | Yes |
| Internal linking + OG | Yes |
| 404 / security boundary | Yes |
| Performance SEO audited | Yes (documented) |
| Browser QA | Yes (preview) |
| Lint / test / build | Yes |
| Live indexing verified | **No** (external) |

**MASTER 03:** **COMPLETE** for in-repo SEO + search architecture.  
**Production search platforms:** **READY WITH LIMITATIONS** until GSC/Bing verification and post-deploy sitemap submission.
