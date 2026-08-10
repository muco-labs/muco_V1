# Webflow asset audit — Muco's Top-Notch Site

Site ID: `6a761c1c71343758bba0354a`  
**Note:** Production marketing is the React app in this repo. This Webflow site holds legacy template assets.

## Summary (36 assets)

| Issue | Count |
|-------|-------|
| Missing alt text | 33 |
| Has alt text | 3 (Arrow.svg, epiQ.svg partial legacy) |
| Large JPEG stock (Travel, Testimonial, Project) | Legacy template — not used on React site |
| Brand meta (Favicon, Webclip, OG) | Updated via API (see below) |

## React `/public` assets

| Asset | Alt / usage |
|-------|-------------|
| `/brand/muco-logo-mark.png` | Decorative in nav/footer (`alt=""`) |
| `/brand/Founder.png` | Founder portrait with name in content |
| `/brand/hero-poster.svg` | WebGL fallback (decorative) |
| Team photos | About page with names |

## Recommended Webflow actions

1. Replace OG / favicon / webclip with current MUCO brand when publishing Webflow again.
2. Remove or archive unused template photography (Travel*, Testimonial*, fake client logos).
3. Do not republish legacy testimonials on mucolabs.com — React content is truth-sourced.
