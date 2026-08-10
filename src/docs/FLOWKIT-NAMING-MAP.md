# FlowKit naming map (MUCO Labs codebase)

Production marketing UI lives in this **Vite + React** app (`muco-labs-v1`), not in the legacy Webflow template site. FlowKit-style classes in `src/styles/flowkit.css` align with Webflow FlowKit v2 conventions for future Designer parity.

## CSS utilities (`fk-*`)

| Class | Role |
|-------|------|
| `fk-section` | Section vertical rhythm (`--section-gap`) |
| `fk-section--tight` | Reduced section padding |
| `fk-eyebrow` | Gradient uppercase label |
| `fk-scene` / `fk-scene__canvas` / `fk-scene__content` | 3D scene frame + content stack |
| `fk-container` | Max-width container (matches `.shell`) |
| `fk-flex`, `fk-flex-col`, `fk-flex-center`, `fk-flex-between` | Flex layouts |
| `fk-grid-2`, `fk-grid-3` | Responsive grids |
| `fk-stack`, `fk-space-md`, `fk-space-lg` | Vertical / gap spacing |
| `fk-text-muted` | Muted body color |

## React component naming

| Pattern | Examples |
|---------|----------|
| Page | `HomePage`, `ServicesPage`, `ContactPage` |
| Section | `SignatureHero`, `HomeSystems`, `PageHero` |
| Design system | `ServiceCard`, `ProjectCard`, `FinalCta` |
| Three.js | `DecorativeScene`, `HeroAuroraScene`, `HeroSceneFallback` |
| Layout | `Navbar`, `Footer`, `MainLayout` |

## State modifiers (combo)

Use `is-*` in CSS modules where needed (e.g. `styles.scrolled`, `styles.featured`) — mirror FlowKit `is-active`, `is-featured`.

## Webflow Designer

`flowkit-naming` MCP skill applies when editing **Webflow Designer** classes on site `Muco's Top-Notch Site` (`6a761c1c71343758bba0354a`). That site is a separate legacy template; **mucolabs.com production** is this repository.
