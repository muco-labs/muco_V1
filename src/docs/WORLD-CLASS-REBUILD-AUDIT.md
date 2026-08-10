# World-Class Rebuild — Audit (Phase 1)

Generated as part of the MUCO LABS marketing rebuild. Public marketing scope only; portals unchanged.

## Route map (MainLayout / path prefix)

| Path | Page | Marketing priority |
|------|------|-------------------|
| `/` | HomePage | P0 |
| `/services`, `/services/:slug` | Services, ServiceDetail | P0 |
| `/solutions`, `/solutions/:industrySlug` | Solutions | P1 |
| `/work`, `/work/:slug` | Work, WorkProject | P0 |
| `/about` | About | P0 |
| `/contact` | Contact | P0 |
| `/products`, `/products/client-hub` | Products, Client Hub | P0 |
| `/pricing` | Pricing | P1 |
| `/careers/*`, `/freelancers/apply` | Careers flows | P1 |
| `/insights` | Insights | P2 |
| `/erode`, `/erode/:serviceSlug` | Local SEO | P1 |
| `/tamil-nadu`, `/india`, `/international` | Market landers | P1 |
| `/start-project` | Start project entry | P1 |
| Legal | privacy, terms, cookies | P2 |
| Auth shells | sign-in, callback, etc. | P1 (visual only) |

Subdomain routing (`customer`, `employee`, `freelancer`, `admin`) serves portal apps — out of rebuild scope.

## Visual parity matrix

| Pattern | Pages |
|---------|--------|
| **PageHero + FinalCta** | Services, Work, About |
| **SignatureHero + sections + FinalCta** | Home |
| **PageShell** | Contact, Careers, Insights, legal, apply flows |
| **Bespoke hero (`styles.hero`)** | Products (reused Erode styles), Erode/TN/India/International, Pricing |
| **Custom** | Service detail, Work project, Solutions |

**Rebuild targets:** Products (dedicated layout), Contact (PageHero), geo landers (shared template), Services/Work/About (R3F accents).

## Motion inventory

| Mechanism | Location | Reduced motion |
|-----------|----------|----------------|
| Aurora CSS | `global.css`, MainLayout | N/A (static gradient fallback acceptable) |
| `PageTransition` | MainLayout | Shortened transitions |
| `Reveal` | Most marketing sections | Instant show |
| `SignatureHero` | Word stagger, parallax, Magnetic CTAs | Static headline |
| `ScrollProgress` | MainLayout | Hidden |
| `TechnicalBackdrop` / `HeroSignalPanel` | Hero | No tilt / static |
| `useSurfaceSpotlight` | `.surface` hover | Disabled via `@media (hover)` |

**Planned:** R3F scenes behind `ReducedMotionSceneGate` + lazy `SceneCanvas`.

## Content truth

- **Work:** Labeled internal/concept/demo — no fake client logos or revenue.
- **Products:** Waitlist/validation language; services company first.
- **About/team:** Real names and photos from `public/brand/`.
- **Local SEO:** No fabricated office addresses; Erode presence is ethical/local.

## Asset inventory

| Asset | Path | Notes |
|-------|------|--------|
| Logo mark | `/brand/muco-logo-mark.png` | Used navbar/footer |
| Founder | `/brand/Founder.png` | About |
| Team | `chandru.png`, `marimuthu.png`, `Vinoth.png`, `Venkatesh.jpeg` | About |
| OG | `/og/og-default.svg` | Default share image |

**Gaps:** Wide logo SVG, hero poster for R3F fallback, portfolio case imagery (mostly SVG previews in code).

## Performance baseline

Run `npm run build` after changes; record largest JS chunks in dist/assets. Target: lazy-loaded R3F per route, LCP poster on hero.

## Issues logged for implementation

1. ProductsPage imports `ErodePage.module.css` — replace with dedicated module.
2. `src/sections/home/*` — unused legacy sections; remove after import check.
3. No WebGL — add `@react-three/fiber`, `three`, `@react-three/drei` with route-level code splitting.
4. Footer/Navbar — elevate to signature chrome (aurora blur, magnetic primary CTA).
5. Figma MCP — blocked; tokens in `src/styles/tokens.css` remain source of truth.
