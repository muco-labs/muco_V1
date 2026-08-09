# PHASE 4.44 — Portal Hosting, Vercel Subdomains, DNS, SSL, Env, CORS & Production Portal Deployment (MASTER 17)

**Date:** 2026-08-10  
**Repository commit (audit time):** `4406c5e` (MASTER 16 on `main`)  
**Verdict:** **READY WITH LIMITATIONS** — public site **preserved**; **portal subdomains NOT deployed** (DNS missing)  
**Portal production complete:** **NO** (blocked on external DNS + Vercel domain attach + dashboard config)

---

## 1. Executive summary

MASTER 17 audited **real** hosting state without modifying public DNS or detaching domains. Evidence shows **`https://www.mucolabs.com` is live on Vercel**, serves this codebase’s API shape (`GET /api/health` → `database: connected`), and **public paths respond HTTP 200**. **Portal hostnames (`app`, `team`, `freelancers`, `admin`) do not resolve in DNS** — they cannot be SSL-verified or browser-QA’d on production yet.

**No public website changes were executed.** No portal DNS records were created. No Vercel dashboard domain attach was performed (CLI unavailable; dashboard access not audited).

**Recommended architecture confirmed:** **one Vercel project (`muco-v1`)** + multiple custom domains on the same deployment.

---

## 2. Current hosting map

| Item | Status | Evidence |
|------|--------|----------|
| Public www | **VERIFIED** | HTTP 200, `Server: Vercel` |
| Public apex | **VERIFIED** | HTTP 308 → `https://www.mucolabs.com/` |
| Staging URL | **VERIFIED** | `https://muco-v1.vercel.app` HTTP 200, health OK |
| Same app on www + staging | **LIKELY** | Identical CSP/security headers; same health JSON; robots/sitemap line matches staging |
| Repo ↔ Vercel link | **VERIFIED** (local) | `.vercel/project.json` → `muco-v1`, `prj_pHjdu8E8zF8EN3HjAzoT3nJcjmT4` |
| GitHub deploy branch | **NOT VERIFIED** (CLI) | Docs + prior masters: `main` → `muco-labs/muco_V1` |
| Vercel Production env matrix | **NOT VERIFIED** | No `vercel` CLI; no dashboard session in this run |
| Portal subdomains DNS | **MISSING** | `nslookup` → NXDOMAIN for all four |
| MASTER 16 on production www | **NOT VERIFIED** | `/app/` returns **200** on www (no client redirect to `app.mucolabs.com` yet) — deploy may predate `4406c5e` or env not rebuilt |

Probe artifact: `src/docs/master-17-hosting-probe.json` (regenerate: `node scripts/master-17-portal-hosting-discovery.mjs`).

---

## 3. Public website baseline (pre/post — no hosting change)

| Check | Result |
|-------|--------|
| HTTPS www | **VERIFIED** 200 |
| Apex → www | **VERIFIED** 308 |
| `/`, `/about`, `/services`, `/contact`, `/careers`, `/insights`, `/pricing` | **VERIFIED** 200 |
| `/api/health` | **VERIFIED** 200, DB connected |
| `robots.txt` | **VERIFIED** 200; disallows portal path prefixes |
| Sitemap in live `robots.txt` | **GAP** — `Sitemap: https://muco-v1.vercel.app/sitemap.xml` (should be `https://www.mucolabs.com/sitemap.xml` after `VITE_SITE_URL` on **Production**) |
| `/app`, `/admin` on www | **200** (SPA shell; legacy paths still reachable until MASTER 16 build promoted + redirect runs) |

**Public website baseline: FUNCTIONAL** at time of probe. Re-run baseline after any DNS or production deploy.

---

## 4. Vercel project decision

| Decision | Rationale |
|----------|-----------|
| **KEEP one project (`muco-v1`)** | `vercel.json` SPA + `/api` rewrite; MASTER 16 subdomain routing in one bundle; www already on Vercel with same stack |
| **Do NOT split** admin/team/app/freelancer projects | No technical blocker identified |

---

## 5. DNS provider

| Item | Status |
|------|--------|
| Authoritative registrar | **NOT VERIFIED** in this session (prior docs reference GoDaddy — treat as **historical hint only**) |
| www resolution | **VERIFIED** → Vercel (`0d16d8cef8e2c352.vercel-dns-017.com` / `216.198.79.1`) |
| apex `mucolabs.com` | **VERIFIED** A → `216.198.79.1` (Vercel) |
| Portal CNAMEs | **MISSING** |

**Do not delete MX/SPF/DKIM/DMARC** when adding portal records. Export DNS before changes (`server/docs/DEPLOYMENT.md`).

---

## 6. Domain records (required — use Vercel UI values)

Attach in **Vercel → muco-v1 → Settings → Domains** first; copy **exact** targets from Vercel (do not hard-code in repo).

| Hostname | Type (typical) | Purpose | Current | Required |
|----------|----------------|---------|---------|----------|
| `www.mucolabs.com` | CNAME/A | Public marketing | **Attached** (serving) | **Preserve** |
| `mucolabs.com` | A/ALIAS | Apex redirect to www | **Attached** | **Preserve** |
| `app.mucolabs.com` | CNAME | Customer portal | **MISSING** | Add per Vercel |
| `team.mucolabs.com` | CNAME | Employee portal | **MISSING** | Add per Vercel |
| `freelancers.mucolabs.com` | CNAME | Freelancer portal | **MISSING** | Add per Vercel |
| `admin.mucolabs.com` | CNAME | Admin portal | **MISSING** | Add per Vercel |

---

## 7. SSL / HTTPS

| Host | SSL verified |
|------|----------------|
| www.mucolabs.com | **VERIFIED** (HTTPS 200) |
| mucolabs.com | **VERIFIED** (HTTPS 308) |
| muco-v1.vercel.app | **VERIFIED** |
| app / team / freelancers / admin | **NOT VERIFIED** (no DNS) |

After DNS: confirm certificate issuance in Vercel Domains UI before cutover comms.

---

## 8. Public domain preservation

**Phase AA satisfied for this master:** no public DNS or apex/www changes were made.

If attaching portals ever required **removing** www from `muco-v1`: **STOP** — document **BLOCKED — PUBLIC DOMAIN CHANGE WOULD BE REQUIRED**.

---

## 9–12. Portal subdomains (customer / employee / freelancer / admin)

| Portal | Reachable | Root routing (`/`) | SSL |
|--------|-----------|-------------------|-----|
| Customer `app.` | **NO** | Code ready (MASTER 16) | **N/A** |
| Employee `team.` | **NO** | Code ready | **N/A** |
| Freelancer `freelancers.` | **NO** | Code ready | **N/A** |
| Admin `admin.` | **NO** | Code ready | **N/A** |

**EXTERNAL CONFIGURATION REQUIRED:** DNS + Vercel domain attach + production deploy containing MASTER 16.

---

## 13. Domain routing (application)

**VERIFIED** in repo tests (`src/config/domains/domains.test.ts`). **NOT VERIFIED** on live portal hosts (unreachable).

---

## 14. Role enforcement

**VERIFIED** in automated tests (domain + profile flags; server `requirePortal` unchanged). **NOT VERIFIED** live on portal subdomains (no hosts).

---

## 15. Supabase Auth redirects

| Item | Status |
|------|--------|
| Supabase project | **VERIFIED** exists: `muco lab website` (`ltmaweunlnlpllrzzscq`), ACTIVE |
| Redirect URL allowlist | **NOT VERIFIED** (dashboard) |
| Required origins (when live) | `https://www.mucolabs.com`, `https://mucolabs.com`, `https://app.mucolabs.com`, `https://team.mucolabs.com`, `https://freelancers.mucolabs.com`, `https://admin.mucolabs.com`, plus `https://muco-v1.vercel.app`, `http://localhost:5173` |
| Per-origin `/auth/callback` | **EXTERNAL CONFIGURATION REQUIRED** |

---

## 16. Session architecture

Supabase client uses **per-origin** storage by default. **Cross-subdomain SSO is NOT VERIFIED** and may require explicit Supabase/cookie configuration.

**Assumption for go-live:** users sign in on the portal origin they use; do not assume www session works on `app.` without testing.

**NOT VERIFIED** with live credentials in this master.

---

## 17. CORS

| Environment | `CORS_ORIGINS` (local probe) | Behavior |
|-------------|------------------------------|----------|
| Local `.env` | **MISSING** | Same-origin `/api` only (middleware off) |
| Production Vercel | **NOT VERIFIED** | Likely same-origin per host once subdomains attach |

When all portals share one API host per origin (each subdomain calls its own `/api`), CORS may remain empty **per origin**. If API is ever centralized on a different host, set:

`CORS_ORIGINS=https://www.mucolabs.com,https://mucolabs.com,https://app.mucolabs.com,https://team.mucolabs.com,https://freelancers.mucolabs.com,https://admin.mucolabs.com`

Never `*` for authenticated APIs.

---

## 18. Environment matrix (presence only — no values)

Local presence from discovery script (Production Vercel **NOT VERIFIED**):

| Variable | Local | Preview | Production |
|----------|-------|---------|------------|
| `DATABASE_URL` | PRESENT | NOT VERIFIED | NOT VERIFIED |
| `SUPABASE_URL` / service role | PRESENT | NOT VERIFIED | NOT VERIFIED |
| `VITE_SUPABASE_*` | PRESENT | NOT VERIFIED | NOT VERIFIED |
| `CORS_ORIGINS` | MISSING | NOT VERIFIED | NOT VERIFIED |
| `VITE_SITE_URL` | MISSING (uses build default) | NOT VERIFIED | **SET `https://www.mucolabs.com`** (fixes live robots sitemap) |
| `VITE_PORTAL_ORIGIN_*` | MISSING (defaults OK) | Optional | Optional |
| `RAZORPAY_*` | MISSING | — | BLOCKED for payments QA |
| `FOUNDER_BOOTSTRAP` | MISSING | — | — |
| `VITE_GA_MEASUREMENT_ID` | MISSING | — | EXTERNAL if analytics desired |
| `RESEND_API_KEY` | MISSING | — | Optional |

---

## 19. SEO

| Surface | Status |
|---------|--------|
| Public indexable | **VERIFIED** intent; live sitemap URL in robots **needs Production `VITE_SITE_URL`** |
| Portal noindex | **VERIFIED** in portal layouts (`PageMeta`) |
| Portal in sitemap | **VERIFIED** excluded from generated sitemap (path-prefix disallow) |
| Subdomain portals in robots | **N/A** until live |

---

## 20. Analytics

`VITE_GA_MEASUREMENT_ID` **MISSING** locally. CSP allows GTM/GA on deployed www (**VERIFIED** in headers). Portal tracking strategy: **NOT VERIFIED**.

---

## 21–22. Browser & responsive QA

| Portal URL | Unauthenticated QA |
|------------|-------------------|
| www | **PARTIAL** — HTTP smoke only |
| app / team / freelancers / admin | **BLOCKED** — DNS |

Responsive breakpoints: **NOT RUN** on production portals.

---

## 23. API health

| URL | Result |
|-----|--------|
| `https://www.mucolabs.com/api/health` | **VERIFIED** 200, ok, DB connected |
| `https://muco-v1.vercel.app/api/health` | **VERIFIED** 200 |

---

## 24. Security

Automated security/domain tests: **PASS** (vitest). Live cross-domain denial on portal hosts: **NOT VERIFIED**.

---

## 25. Performance

Single SPA bundle; portal routes lazy-loaded via React Router. No regression measured vs prior master. **NOT VERIFIED** with Lighthouse on portal subdomains.

---

## 26. Deployment verification

| Field | Value |
|-------|--------|
| Intended commit | `4406c5e` (MASTER 16) |
| Live www deploy SHA | **NOT VERIFIED** (no Vercel API) |
| Production promotion | **NOT EXECUTED** in this master |

**Action:** After merge, confirm Vercel Production deployment SHA ≥ `4406c5e` before expecting www `/app` → `app.mucolabs.com` redirects.

---

## 27. Rollback plan

1. **Public broken:** Vercel → promote previous Production deployment; revert DNS only if changed for portals (www/apex unchanged in this master).
2. **Portal redirect loop:** disable new domains in Vercel; remove bad DNS; redeploy prior SHA.
3. **Auth failure:** revert Supabase redirect URL changes; redeploy.
4. **Never** drop DB or reset Supabase in rollback.

---

## 28. External configuration checklist

1. Vercel: add `app`, `team`, `freelancers`, `admin` to **muco-v1** (keep www/apex).
2. DNS: create records per Vercel instructions only.
3. Vercel Production: `VITE_SITE_URL=https://www.mucolabs.com`.
4. Supabase: Site URL + redirect allowlist for all origins + `/auth/callback`.
5. Optional: `CORS_ORIGINS` if cross-origin API.
6. Promote production deploy with MASTER 16+ code.
7. Re-run `node scripts/master-17-portal-hosting-discovery.mjs`.
8. Manual auth smoke per portal (no fabricated sessions).

---

## 29. Blockers

| ID | Blocker |
|----|---------|
| B-17-01 | Portal DNS records do not exist |
| B-17-02 | Vercel custom domains for portals not attached |
| B-17-03 | Supabase redirect allowlist not verified |
| B-17-04 | Production may lag `4406c5e` (legacy `/app` on www) |
| B-17-05 | Live robots sitemap still points at `muco-v1.vercel.app` |
| B-17-06 | Razorpay / storage bucket / migration journal (MASTER 13–14) unchanged |

---

## 30. Remaining work

1. Execute external checklist (§28) with operator access.
2. Post-deploy browser QA on all five portal origins.
3. Verify SSL on each subdomain.
4. OAuth E2E per origin (MASTER 15 limitation).
5. Set Production env matrix via Vercel dashboard audit.

---

## 31. Final status vs definition of done

| Criterion | Status |
|-----------|--------|
| Public hosting identified | ✓ |
| Public preserved | ✓ (no changes made) |
| Vercel project identified | ✓ `muco-v1` |
| Portal domains configured | ✗ DNS/Vercel |
| SSL on portals | ✗ |
| Portals reachable | ✗ |
| Supabase redirects verified | ✗ |
| CORS verified (prod) | ✗ |
| Portal browser QA | ✗ blocked |
| Lint / build / tests | ✓ |

**MASTER 17 = READY WITH LIMITATIONS** (audit + runbooks + probes complete; **portal production deployment blocked on external steps**).

---

## Build gates (this session)

```
npm run lint     → PASS
npm run build    → PASS
vitest           → 458 passed, 2 skipped
```

Scripts: `scripts/master-17-portal-hosting-discovery.mjs`, `scripts/master-14-go-live-gate.mjs` (infra presence).

---

## Architecture (target — unchanged)

```
www.mucolabs.com  ──┐
app.mucolabs.com  ──┤
team.mucolabs.com ──┼──► Vercel muco-v1 (one build) ──► /api ──► Supabase + Postgres
freelancers.*     ──┤
admin.mucolabs.com──┘
```

**Public site remains the protected baseline; portal work is additive.**
