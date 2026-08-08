# Phase 2 / Stage 3 — Content audit map

**Date:** 2026-08-09  
**Scope:** Public marketing site only (no backend schema changes).

## Verified business data (keep)

| Area | Source | Notes |
|------|--------|--------|
| Company name & legal | `content/company.ts` | MUCO LABS / Technology & Digital Innovations |
| Location | `content/company.ts` | Erode, TN 638001, India |
| Contact | `content/contact.ts` | contact@mucolabs.com, +91 63818 09844 |
| Social | `content/social.ts` | Instagram, LinkedIn company, X — verified URLs only |
| Founder name & title | `content/founder.ts` | Srinivash Mahalingam, Founder & MD |
| Public pricing “from” | `content/pricing.ts` | Aligned with mucolabs.com catalog |
| Testimonials | `data/testimonials.ts` | **Empty** — intentional |
| Trust pillars | `data/testimonials.ts` | Process honesty, no fake reviews |

## Placeholder / pending (label clearly)

| Item | Status | UI treatment |
|------|--------|----------------|
| Founder photo | Pending asset | `FounderPortrait` caption “Founder photo” |
| Team photos | Only verified members listed | Caption “Team photo” |
| Portfolio screenshots | Mostly visual previews | Note on detail pages |
| Client case studies | None published | No `client` kind projects yet |
| Insights articles | Stub copy in `content/insights.ts` | Not fake articles |
| Personal founder LinkedIn | Not verified | Only company LinkedIn linked |

## Removed / avoided

- No lorem ipsum in public `src/`
- No fabricated client logos, awards, revenue, or employee counts
- No Geetham or other client names in repo — **not added** without verification
- Home “delivery focus” meters — labeled illustrative, not client metrics

## Duplication resolved

- **Process:** single source `content/process.ts` (home + about)
- **Portfolio:** single source `content/portfolio.ts` via `data/portfolio.ts`
- **Company copy:** extended in `content/company.ts`; `config/site.ts` SEO defaults aligned

## Weak copy upgraded (Stage 3)

- About: who we are, what we build, how we work, engineering philosophy
- Services catalog: full public service list in footer
- FAQs: remote work, quotes, APIs, payments, custom software
- Contact: what to include + what happens after submit
- Work: internal MUCO projects + labeled concepts; `/work/:slug` detail pages

## Legal pages

- Routes: `/privacy-policy`, `/terms`, `/cookie-policy` (existing)
- Content: template-level; professional legal review recommended before relying on for compliance

## QA search terms (public site)

- `Lorem`, `TODO`, `FIXME`, `Test User`, `example.com` — none in public content paths
- Portal “coming soon” SEO strings remain `noIndex` on auth pages only
