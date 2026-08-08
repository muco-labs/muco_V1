# Phase 2 / Stage 1 — Design audit (internal)

## Current UI problems (pre-change)

| Area | Issue |
|------|--------|
| Hero | Headline abstract (“with intent”)—value prop not instant |
| Hero visual | Static panel; limited signature motion |
| Navigation | Missing Pricing/Contact in primary nav; Insights competed with conversion paths |
| Trust | No dedicated trust strip without fake metrics |
| Founder | Founder story buried in team section |
| Portfolio | Single “concept work” label—not typed (client vs concept vs demo) |
| Tokens | Missing `--text-button`, `--color-accent-muted` (Badge broken contrast) |
| Motion | No shared motion distance/stagger tokens |

## New design direction

- **Premium dark** base with **chartreuse accent** (Gen 3 tokens retained, refined)
- **Retro-futurist signal**: terminal motif + scan line + subtle pointer tilt (not a retro theme park)
- **Conversion-first**: Start a Project primary; Services/Work secondary
- **Honest portfolio**: explicit `kind` badges (Concept, Client, etc.)

## What changed (Stage 1)

- Design tokens: motion + badge color fixes
- Homepage: hero copy, `HeroSignalPanel`, `HomeTrustStrip`, `HomeFounderSpotlight`
- Navigation: Services → Solutions → Work → About → Pricing → Contact
- Portfolio model: `PortfolioKind` + labels on Work page
- No backend, portal, or API changes

## Remaining assets (content)

- Founder professional photograph (`founder.imageSrc`)
- Verified client case studies (`kind: 'client' | 'case_study'`)
- Team member photos and bios where marked placeholder
- Razorpay checkout UI (separate from this phase)

## SEO

- `PageMeta`, structured data, and routes unchanged on public pages
- Portal layouts remain `noindex`
