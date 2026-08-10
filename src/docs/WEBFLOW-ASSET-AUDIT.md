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

## Webflow Designer (logo upload)

To upload current brand assets into Webflow, open Designer with MCP connected:

[Open Muco's Top-Notch Site in Webflow Designer (MCP)](https://mucos-top-notch-site.design.webflow.com?app=dc8209c65e3ec02254d15275ca056539c89f6d15741893a0adf29ad6f381eb99)

Then re-run asset upload from `https://www.mucolabs.com/brand/muco-logo-mark.png` and replace OG/favicon in site settings.

2. Remove or archive unused template photography (Travel*, Testimonial*, fake client logos).
3. Do not republish legacy testimonials on mucolabs.com — React content is truth-sourced.
