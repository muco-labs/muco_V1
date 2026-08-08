# Phase 7 — Erode market report

## Summary

Phase 7 adds **ethical local presence** for Erode: three high-value `/erode/*` service pages, improved `/erode` hub linking, voluntary **business city** on inquiries, CRM **locality filters**, an **Erode market** admin dashboard, analytics event `erode_service_view`, sitemap/indexable routes, and internal playbooks/audits. No fabricated offices, reviews, clients, or doorway pages.

## Deliverables map (§58)

| # | Topic | Status |
|---|--------|--------|
| 1–3 | Market audit, competitors, intent | `PHASE7-ERODE-MARKET-AUDIT.md` |
| 4 | Keyword mapping | Hub + 3 service slugs only; national services elsewhere |
| 5 | Erode landing | `/erode` (`ErodePage.tsx`, `erode-local.ts`) |
| 6 | Local service pages | `/erode/web-development`, `software-development`, `seo` |
| 7 | Content strategy | Audit doc + existing blog-ready topics listed there |
| 8–9 | Industry & personas | Documented in audit; no thin industry doorways |
| 10 | Value proposition | Founder-led, honest location, concept vs client labeling |
| 11 | GBP | `PHASE7-GBP-EXTERNAL-CHECKLIST.md` (Founder) |
| 12 | LocalBusiness schema | Existing `StructuredData` + verified `company.location` |
| 13–14 | NAP & citations | Checklist; no auto submissions |
| 15 | Review strategy | `PHASE7-REVIEW-REQUEST-WORKFLOW.md` |
| 16–18 | Testimonials, portfolio, case studies | Phase 2/6 rules unchanged; no new fake local work |
| 19–21 | Trust, conversion, CTA | Inquiry form, contact links with optional city prefill |
| 22 | Lead attribution | `businessCity`, landing path, page source |
| 23 | CRM segment | `locality=erode|tamil_nadu` on admin leads API + UI |
| 24 | Sales playbook | `PHASE7-ERODE-SALES-PLAYBOOK.md` |
| 25–27 | Outreach, partnerships, referrals | Documented; no bulk outreach |
| 28–29 | Content clusters & internal links | Erode hub → local services → national services → contact |
| 30–31 | Metadata & structured data | Per-page SEO helpers + breadcrumbs/FAQ schema on local pages |
| 32–34 | GSC, analytics, conversion | Events + admin dashboard; GSC monitoring in checklist |
| 35 | Competitor gaps | Audit table |
| 36–38 | Backlinks, PR, social | Ethical strategies in audit/checklist |
| 39–41 | Brand search, mobile, trust/contact | Existing site + local pages mobile-first |
| 42–44 | Offers & prioritization matrices | In audit |
| 45–47 | Sales materials & reputation | Playbook + review workflow |
| 48–50 | Lead quality, revenue, dashboard | `GET /api/v1/admin/local/erode-dashboard`, Admin → Erode market |
| 51–53 | Security, performance, a11y | Preserved; no heavy widgets added |
| 54–55 | Testing & SEO validation | lint/test/build; indexable routes + sitemap |
| 56 | E2E local test | Manual: /erode → service → contact → CRM |

## Technical changes

- Migration `0010_lead_business_city.sql`, schema `leads.business_city`
- `server/lib/local/constants.ts`, `server/services/local.service.ts`
- `src/content/erode/local-services.ts`, `ErodeLocalServicePage.tsx`, router + SEO
- `InquiryForm` optional business city; API `createLeadSchema.businessCity`
- Admin: `/admin/local/erode`, `/admin/crm/list` with locality filter

## Validation

Run locally: `npm run lint`, `npm test`, `npm run build` — record results in commit message / release notes.

## Remaining external actions

See `PHASE7-GBP-EXTERNAL-CHECKLIST.md` and review workflow. Founder must verify GBP, pursue real reviews after delivery, and monitor Search Console for Erode queries.
