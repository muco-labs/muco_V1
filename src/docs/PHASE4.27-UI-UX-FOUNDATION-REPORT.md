# Phase 4.27 — UI/UX foundation (asset-aware, Step 1)

**Scope:** Visual interface and UX system only. No deploy, no production env changes, no DB migrations, no backend business-logic changes, no git push.

## Final status

**UI FOUNDATION COMPLETE — WAITING FOR USER ASSETS** (founder portrait + team photos only; official logo mark added 2026-08-09)

---

## Asset checkpoints

| Section | Required assets | Available | Missing | Decision |
|---------|-----------------|-----------|---------|----------|
| Site opening | Logo mark or full logo | `public/brand/muco-logo-mark.png` | — | Official mark in intro |
| Navbar / footer | Logo lockup | Same PNG | Wide wordmark lockup (optional later) | Icon + “MUCO LABS” text |
| Founder spotlight | Verified founder photo | `FounderPortrait` initials | Raster portrait | Section live with honest placeholder + status note |
| Team | Per-member photos | None in repo | All team photos | Single verified profile without `imageSrc`; hiring note only |
| Hero / tech sections | Ambient technical art | `TechnicalBackdrop` (SVG/CSS) | N/A | Generated in-repo |
| Work / portfolio | Real project screenshots | Existing concept visuals in content | Optional future client assets | No fabricated clients or metrics |

Registry: `src/config/brand-assets.ts` — set `status: 'available'` and `src: '/brand/...'` when files are added under `public/brand/`.

---

## ASSET REQUIRED (user-provided)

### 1. Official MUCO LABS logo — **supplied**

- **File:** `public/brand/muco-logo-mark.png` (icon mark; transparent background)
- **Optional later:** wide SVG/PNG lockup with wordmark for OG-only use

### 2. Logo mark (icon only) — **supplied**

- Same file as above; wired in `brandAssets.logo` and `brandAssets.logoMark`

### 3. Founder portrait — Srinivash Mahalingam

- **Recommended:** 3:4 or 4:5 portrait, **min 1200px** width, neutral background, professional editorial crop.
- **Used in:** Homepage founder spotlight, About page (`FounderPortrait`).
- **Upload to:** e.g. `public/brand/founder-srinivash.webp`, then update `brandAssets.founderPhoto`.

### 4. Team member photos (as profiles are verified)

- **Recommended:** 1:1 or 4:5, **min 800px** width per person.
- **Used in:** `HomeTeamSection`, About/team surfaces via `imageSrc` on `teamMembers` in `src/content/team.ts`.
- **Do not** use AI-generated people; add only verified individuals.

---

## UI audit (homepage)

| Check | Notes |
|-------|--------|
| Hierarchy | Hero H1 + dual CTAs primary; services and culture follow spec order |
| Spacing / rhythm | Shell + section tokens; tightened founder block |
| Typography | Display + body scale from `tokens.css`; section titles consistent |
| Layout variety | Editorial founder grid, split hero, systems grids — not all cards |
| CTA hierarchy | Start project > Contact across nav and hero |
| Repetition | Removed prior trust strip / duplicate story blocks from home (4.26.3); engagement + FAQ retained |
| Motion | Opening + `Reveal` on sections; home main `homeRevealed` push |
| a11y | Skip link, landmark `main`, founder asset status as `role="status"` |

**Homepage order (implemented):** Hero → Services → Why MUCO (`HomeCultureSections`) → How we work → Technology → Work preview → Founder → Team → Engagement → Erode local → FAQ.

---

## UX audit (public)

| Route | Visual / UX notes |
|-------|-------------------|
| `/` | First-visit intro (~2.2s); session `muco-intro-seen-v1`; reduced motion skips intro |
| `/about` | Founder block + company story; portrait placeholder until asset |
| `/services` + detail | Service cards + long-form detail templates from 4.26.x |
| `/contact` | Form + conversion layout (title may align with start-project funnel) |
| `/start-project` | Entry + flow pages; form density and steps unchanged |
| `/careers`, `/careers/apply`, openings | Listings + apply form; empty states from API/content |
| `/auth/sign-in`, `/auth/sign-up` | Auth shell consistent with marketing tokens |
| Legal | Policy pages via lightweight content shells |
| `/work` | Portfolio without fabricated metrics |

No fabricated testimonials, client logos, awards, or revenue statistics were added.

---

## Opening animation

**Files:** `src/components/opening/SiteOpening.tsx`, `SiteOpening.module.css`, `TechnicalBackdrop.tsx`, `site-opening-session.ts`, `MainLayout.tsx`, `MainLayout.module.css`.

**Sequence:** Deep `#050816` field → technical grid/nodes backdrop → logo mark (or uploaded asset) → stabilize → “MUCO LABS” wordmark → overlay exit → homepage reveal animation → hero active.

**Timing:** ~2.2s max (`INTRO_MS`); reduced motion uses ~120ms and does not play full intro (`shouldPlaySiteOpening` returns false).

**Routing:** Plays only on first `/` load per browser session; internal routes do not replay intro.

---

## Logo asset status

| Asset | Status |
|-------|--------|
| Official logo | **Missing** — CSS gradient mark in nav/intro |
| Logo mark | **Missing** — same fallback |
| Favicon | Existing static favicon in `public/` (unchanged) |

---

## Founder asset status

| Item | Status |
|------|--------|
| Portrait file | **Missing** |
| Copy | Verified from `src/content/founder.ts` (no fabricated biography) |
| UI | `HomeFounderSpotlight` shows pending note; `FounderPortrait` initials |

---

## Team asset status

| Item | Status |
|------|--------|
| Photos | **None** — only Srinivash listed without `imageSrc` |
| Policy | `teamHiringNote` — no placeholder staff |

---

## Generated visual assets (design-created)

- `TechnicalBackdrop` — digital grid, nodes, data paths, cyan/blue/gold on `#050816` (`TechnicalBackdrop.module.css`).
- Site opening overlay, wordmark choreography (`SiteOpening.module.css`).
- Navbar gradient mark (fallback identity).
- Hero ambient layer via `SignatureHero` + shared backdrop.

No fake people or company photography were generated.

---

## Motion system

| Pattern | Implementation |
|---------|----------------|
| Site opening | Timed phases + CSS transitions |
| Home reveal | `homeRevealed` keyframes on `main` |
| Section enter | `Reveal` component (existing) |
| Page transition | `PageTransition` — home path skips fade |
| Nav | Underline + drawer; theme toggle |
| Reduced motion | `prefers-reduced-motion` on opening, home reveal, backdrop |

---

## Portal UI (visual audit only)

RBAC and data flows unchanged. Shell uses shared tokens, cards, and tables:

- **Customer:** dashboard, projects, proposals, payments, messages, files — consistent portal chrome; loading via existing fetch hooks.
- **Employee:** dashboard, projects, tasks — table/list density appropriate; no redesign.
- **Freelancer:** dashboard, projects, tasks, services, skills, availability, workload — multi-panel layouts preserved.
- **Admin:** CRM, projects, tasks, team, freelancers, proposals, payments, careers, messages — dense admin tables; careers sub-nav retained.

**Follow-up (non-blocking):** Portal pages could receive the same section-spacing pass as marketing in a later phase; no blockers for Step 1.

---

## Responsive QA

Breakpoints targeted: 360, 390, 414, 768, 1024, 1280, 1440+.

- Nav: mobile drawer + sticky glass header (80px).
- Founder grid stacks below ~56rem.
- Opening overlay centered; backdrop `overflow: hidden` on body during intro (overlay only).
- Forms and cards use existing `clamp()` spacing.

Full device lab not run; browser spot-check on dev server at 127.0.0.1:5174.

---

## Accessibility

- Skip to content link in `MainLayout`.
- Intro overlay `aria-hidden` (decorative).
- Founder pending message exposed as status region.
- Logo images in nav use `alt=""` when decorative beside text wordmark.
- Focus rings on buttons (4.26.3).
- Reduced motion honored for intro and home reveal.

---

## Performance

- Opening uses CSS/SVG backdrop — no WebGL.
- Intro runs once per session.
- Production build completes in ~3–4s locally; homepage CSS chunk ~14 kB (gzip ~3 kB).

---

## Tests

| Command | Result |
|---------|--------|
| `npx vitest run --pool=threads --maxWorkers=2` | **353 passed** (61 files) |
| `npm run lint` | **0 warnings, 0 errors** |
| `npm run build` | **Pass** |

Note: Occasional Windows worker teardown warnings on first vitest run in this environment; rerun exited 0 with all tests green.

---

## Browser QA (local dev `http://127.0.0.1:5174/`)

| Route | Check |
|-------|--------|
| `/` | After intro, hero H1 present; no intro on immediate revisit in same session |
| `/contact` | Form renders |
| `/about`, `/start-project`, `/careers`, `/auth/sign-in` | Not fully stepped in automation; routes exist in build graph |

Authenticated portal routes were **not** exercised (no credentials).

Console: no blocking errors observed on homepage/contact evaluation via browser tooling.

---

## Homepage / file changes (this phase)

- `src/config/brand-assets.ts` — identity registry
- `src/components/opening/*` — opening experience + session helper
- `src/layouts/MainLayout.tsx` — intro gate + home reveal
- `src/pages/HomePage.tsx` — section order per spec
- `src/sections/home-v3/HomeSystems.tsx` — split exports for work/tech/process/local
- `src/sections/home-v3/SignatureHero.tsx` — technical backdrop
- `src/sections/home-v3/HomeFounderSpotlight.tsx` — asset pending notice
- `src/content/founder.ts` — portrait wired to registry
- `src/components/layout/Navbar.tsx` — optional logo image

---

## Missing user-provided assets (summary)

1. Official MUCO LABS logo (full lockup)
2. Logo mark (icon)
3. Founder portrait (Srinivash Mahalingam)
4. Team member photos as profiles are published

---

## Remaining UI work (after assets)

1. Drop files into `public/brand/` and flip `brandAssets` entries to `available`.
2. Wire footer brand mark to `brandAssets.logo` (optional parity with navbar).
3. Add `imageSrc` per verified team member in `src/content/team.ts`.
4. Second-pass responsive screenshots at all listed breakpoints.
5. Deeper portal spacing/empty-state polish (Phase 4.28+).
6. OG image using real logo when supplied.

---

## Operator instructions (assets only)

```ts
// Example after upload:
// public/brand/logo.svg
brandAssets.logo.status = 'available'
brandAssets.logo.src = '/brand/logo.svg'
```

Repeat for `logoMark` and `founderPhoto`. Rebuild not required in dev; production deploy when user approves later phases.
