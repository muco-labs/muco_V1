# MUCO Website Intelligence

Internal admin module for URL-based website audits (SEO, content, accessibility, opportunity scoring).

## Access

- Admin routes: `/admin/website-intelligence`
- Permissions: `website_intelligence.view`, `website_intelligence.run` (ADMIN / SUPER_ADMIN / FOUNDER)

## API

- `GET /api/v1/admin/website-intelligence/dashboard`
- `GET /api/v1/admin/website-intelligence/audits`
- `POST /api/v1/admin/website-intelligence/audits`
- `GET /api/v1/admin/website-intelligence/audits/:id`
- `GET /api/v1/admin/website-intelligence/audits/:id/export` (JSON export scaffold)
- `POST /api/v1/admin/website-intelligence/audits/:id/cancel`

## Database

Migration `0017_website_intelligence.sql` — tables `wi_websites`, `wi_audits`, `wi_audit_pages`, `wi_audit_issues`, `wi_audit_metrics`, `wi_audit_events`.

Migration `0018_website_intelligence_coverage.sql` — audit coverage fields (`pages_discovered`, `pages_crawled`, `audit_confidence`, `coverage_note`, `crawl_limitations`).

Run `npm run db:migrate`.

## Environment (server)

- `PAGESPEED_INSIGHTS_API_KEY` — optional; without it performance shows **Not measured**
- `WI_MAX_PAGES`, `WI_MAX_DEPTH`, `WI_REQUEST_TIMEOUT_MS`, `WI_CRAWL_DELAY_MS`, `WI_USER_AGENT`

## Crawl limitations (Phase 1)

- HTML-only BFS; no JavaScript rendering.
- XML sitemaps on the same host are ingested when `/sitemap.xml` (or robots `Sitemap:`) returns real XML.
- SPAs that serve HTML for `/sitemap.xml` and expose routes only via client-side navigation may yield **one page** crawled — reports show **Audit confidence: LOW** and explicit crawl limitations.

## Scoring vs confidence

- **Overall score** reflects issues on **pages actually analyzed** (performance excluded when not measured).
- **Audit confidence** reflects crawl breadth; a high score with one page does **not** imply whole-site health.

## Business analysis (Phase 2)

Completed audits include a deterministic `businessAnalysis` object on `GET .../audits/:id` and JSON export: business impact, MUCO service mapping, opportunity level (separate from technical score), and sales-safe language. No AI or external APIs.

## Smoke test (no DB)

```bash
npx tsx scripts/wi-smoke-audit.ts https://example.com/
```

## Security

SSRF protections: protocol allowlist, blocked hostnames/private IPs, DNS resolution checks before fetch.

## Not in this phase

CRM auto-sync, scheduled scans, AI narrative reports, customer-facing PDFs.
