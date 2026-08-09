# PHASE 4.44.1 — Production SEO Origin Root-Cause Fix (MASTER 17.1)

**Date:** 2026-08-10  
**Verdict:** **COMPLETE** (code fix + tests + local build verification)  
**Live www verification:** **EXTERNAL** — requires Production redeploy after merge

---

## 1. Root cause

**ROOT CAUSE:** `public/sitemap.xml` and `public/robots.txt` are **generated at build time** by `scripts/generate-seo.ts` (also invoked from `vite.config.ts` `buildStart`). The generator used **`process.env.VITE_SITE_URL` verbatim** with no production guard.

Historical **Vercel Production** configuration (see `scripts/sync-muco-v1-production-env.mjs`) set:

`VITE_SITE_URL=https://muco-v1.vercel.app`

That value was baked into static SEO files on every Production build. **`import.meta.env` / client `env.siteUrl` were also compiled with the same value**, so live `https://www.mucolabs.com` could serve www HTML while **robots/sitemap/canonicals still referenced `muco-v1.vercel.app`**.

Updating `VITE_SITE_URL` in the dashboard **should** fix new builds, but:

1. **Stale deployment** — custom domain may lag until a Production build runs with the new resolver.
2. **No guard** — any future mis-set `VITE_SITE_URL` on Production would regress SEO again.
3. **Node vs Vite** — `generate-seo.ts` runs under **tsx/Node** (`process.env`), not Vite `loadEnv`; behavior depends on Vercel-injected env at build start (correct when set, fragile when wrong).

**Not the cause:** missing `DEFAULT_CANONICAL_SITE_URL` (already `https://www.mucolabs.com` when `VITE_SITE_URL` unset). Wrong **explicit** staging URL on Production was the leak.

---

## 2. Files inspected

| Area | Files |
|------|--------|
| SEO generation | `scripts/generate-seo.ts`, `src/config/sitemap.ts`, `src/config/robots.ts`, `src/config/indexable-routes.ts` |
| Canonical | `src/config/canonical-site.ts`, `src/config/env.ts` |
| Build | `package.json` (`build` script), `vite.config.ts` (`muco-seo-artifacts` plugin) |
| Client SEO | `src/components/seo/PageMeta.tsx`, `StructuredData.tsx` |
| Domains | `src/config/domains/portal-origins.ts` |
| Committed output | `public/sitemap.xml`, `public/robots.txt` |
| Historical env | `scripts/sync-muco-v1-production-env.mjs` |

---

## 3. Files changed

| File | Change |
|------|--------|
| `src/config/canonical-site.ts` | Added `resolveCanonicalSiteUrl()` — **forces www when `VERCEL_ENV=production`** |
| `scripts/generate-seo.ts` | Uses `resolveCanonicalSiteUrl()` |
| `src/config/env.ts` | Client `siteUrl` via resolver + `VERCEL_ENV` |
| `src/config/domains/portal-origins.ts` | Public origin via resolver |
| `vite.config.ts` | `define` injects `import.meta.env.VERCEL_ENV` |
| `src/vite-env.d.ts` | `VERCEL_ENV` typing |
| `src/config/canonical-site.test.ts` | Production/preview/staging SEO tests |
| `server/lib/infra/master-14-go-live-gate.test.ts` | Assert no `muco-v1.vercel.app` in committed artifacts |

---

## 4. Why updated `VITE_SITE_URL` alone did not fix production (yet)

- SEO files are **outputs of the build**, not runtime config.
- Until a **new Production deployment** completes, www may still serve the previous `dist` + `public` artifacts.
- If Production env was updated but **Preview** or an old **Production** deployment remained aliased, probes could still show `muco-v1`.
- Code now **ignores** a staging `VITE_SITE_URL` when `VERCEL_ENV=production`, so the next build is safe even if the env var is wrong.

---

## 5. Fix (single source of truth)

`resolveCanonicalSiteUrl()` in `src/config/canonical-site.ts`:

| `VERCEL_ENV` | `VITE_SITE_URL` | Resolved origin |
|--------------|-----------------|-----------------|
| `production` | any (including `muco-v1.vercel.app`) | **`https://www.mucolabs.com`** |
| `preview` / `development` / unset | `https://muco-v1.vercel.app` | staging URL (QA) |
| unset | unset | **`https://www.mucolabs.com`** |

Used by: SEO script, `env.siteUrl`, portal public origin.

---

## 6. SEO behavior

- **robots.txt:** `Sitemap: https://www.mucolabs.com/sitemap.xml` on Production builds.
- **sitemap.xml:** all `<loc>` URLs use `https://www.mucolabs.com/...`.
- **PageMeta / StructuredData:** `env.siteUrl` follows same resolver (client bundle).
- **Portals:** not in sitemap (`indexable-routes` unchanged); subdomain hosts not added.

---

## 7. Tests

- `src/config/canonical-site.test.ts` — production override, preview staging, no `muco-v1` in generated robots/sitemap.
- `master-14-go-live-gate.test.ts` — committed `public/*` must not contain `muco-v1.vercel.app`.

---

## 8. Build

Simulated Production build:

```text
VERCEL_ENV=production VITE_SITE_URL=https://muco-v1.vercel.app npm run build
```

Result: `public/robots.txt` → `Sitemap: https://www.mucolabs.com/sitemap.xml`; no `muco-v1` in `public/sitemap.xml`.

---

## 9. Lint

`npm run lint` → **PASS**

---

## 10. Vitest

`npx vitest run --pool=threads --maxWorkers=2` → **463 passed**, 2 skipped

---

## 11. Remaining external verification

After deploy to Vercel Production:

1. `curl -s https://www.mucolabs.com/robots.txt` → `Sitemap: https://www.mucolabs.com/sitemap.xml`
2. `curl -s https://www.mucolabs.com/sitemap.xml` → only `https://www.mucolabs.com` URLs
3. Optional: view-source on homepage — canonical / `og:url` use www

**Do not** change DNS, Supabase, or OAuth for this fix.

---

## Final status

**COMPLETE** in repository. Live www alignment is **READY WITH LIMITATIONS** until the next Production deployment is verified.
