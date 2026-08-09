# Phase 4.26.1 — API health timeout fix

**Target:** https://muco-v1.vercel.app  
**Date:** 2026-08-09  
**www.mucolabs.com:** unchanged (legacy `mucolabs` project — not this deployment)

## 1. Root cause

Two issues combined to present as `FUNCTION_INVOCATION_TIMEOUT` on `GET /api/health`:

1. **Vercel Node serverless handler contract (primary)**  
   `api/index.ts` used `export default handle(app)` from `hono/vercel`. Vercel logged: *default export returned a `Response` … returns are ignored* for the legacy `(req, res)` default export. Hono produced a valid `Response`, but the platform never sent it to the client, so the request hung until the function invocation timeout (0 bytes received).

2. **Database health probe (secondary hardening)**  
   Earlier health checks used the shared pool with no bounded probe; an unreachable `DATABASE_URL` could block longer than appropriate for serverless. This was hardened with a dedicated probe client, `connect_timeout`, and a ~3.5s `Promise.race` cap. On **muco-v1** production, no `DATABASE_URL` is configured, so the probe path returns `unconfigured` immediately.

3. **V1 routing (exposed after fix #1)**  
   Delegating to the v1 sub-app via `v1.fetch(c.req.raw)` left the request path as `/api/v1/...` while v1 routes were mounted at `/v1/...` only. Fixed with `basePath('/api')` on the v1 app shell.

## 2. Fix

| Area | Change |
|------|--------|
| `api/index.ts` | Export Web `fetch` handler: `export default { fetch: app.fetch.bind(app) }` |
| `server/db/client.ts` | Bounded health probe; serverless-friendly pool options; statuses `connected` \| `unconfigured` \| `unavailable` |
| `server/app.ts` | Lazy `import('./routes/v1/index.js')`; health returns 503 when `database === 'unavailable'` |
| `server/routes/v1/index.ts` | `Hono().basePath('/api')` so `/api/v1/*` matches after sub-app delegation |
| `server/db/client.health.test.ts` | Health probe tests |
| `server/docs/OPERATIONS.md` | Health contract |

## 3. Vercel production env (`muco-labs/muco-v1`)

Verified via `vercel env ls production` — **no variables configured**.

| Variable | Status |
|----------|--------|
| `DATABASE_URL` | MISSING |
| `SUPABASE_URL` | MISSING |
| `SUPABASE_ANON_KEY` | MISSING |
| `SUPABASE_SERVICE_ROLE_KEY` | MISSING |
| `VITE_SUPABASE_URL` | MISSING |
| `VITE_SUPABASE_ANON_KEY` | MISSING |
| `RAZORPAY_*` | MISSING |
| `AUTH_SECRET` / security | MISSING |
| `NVIDIA_API_KEY` | MISSING |

**Note:** Deployment Protection is enabled (CLI generates bypass tokens for `vercel curl`). Public `curl` to `/api/health` succeeds without auth in current testing.

## 4. Database connectivity

- **Production:** `database: "unconfigured"` (no `DATABASE_URL`).
- **When `DATABASE_URL` is set:** probe uses short connect timeout and overall cap; unreachable → `unavailable` + HTTP 503 on health.

## 5. Files changed

- `api/index.ts`
- `server/app.ts`
- `server/db/client.ts`
- `server/db/client.health.test.ts`
- `server/routes/v1/index.ts`
- `server/docs/OPERATIONS.md`
- `.gitignore` (local Vercel link artifacts)
- `src/docs/PHASE4.26.1-API-HEALTH-FIX-REPORT.md` (this file)

## 6–8. Local verification

| Gate | Result |
|------|--------|
| Tests | 353 passed (`npx vitest run --pool=threads --maxWorkers=2`) |
| Build | Pass (`npm run build`) |
| Lint | 0 warnings (`npm run lint`) |

## 9. Deploy

Production deploy: `npx vercel deploy --prod --yes --scope muco-labs` → aliased to https://muco-v1.vercel.app

## 10. Production health

```http
GET https://muco-v1.vercel.app/api/health
```

**Response (~0.8s, HTTP 200):**

```json
{"success":true,"data":{"status":"ok","database":"unconfigured"}}
```

Vercel log: `GET /api/health` status 200, `durationMs`: 3 (cold start excluded).

**Not observed:** `FUNCTION_INVOCATION_TIMEOUT`, blank body, or HTML error page for health.

## 11. Additional API probe

```http
POST https://muco-v1.vercel.app/api/v1/leads
```

**Response (~1.4s, HTTP 503):**

```json
{"success":false,"error":{"code":"SERVICE_UNAVAILABLE","message":"Lead intake is temporarily unavailable. Please email us directly."}}
```

Expected without database configuration — fast failure, no hang, route resolves (not 404).

## 12. Ready for authenticated QA?

| Check | Status |
|-------|--------|
| Frontend on muco-v1 | PASS |
| `/api/health` | PASS (fast, `unconfigured`) |
| Public API routing | PASS (no timeout) |
| Data / auth / payments | **BLOCKED** — production env vars not set on `muco-v1` |

**Verdict:** muco-v1 is ready for **infrastructure** QA (health + routing). **Not** ready for full authenticated integration QA until `DATABASE_URL`, Supabase (`VITE_*` public + server service role), `AUTH_SECRET`, and related production env are configured on the Vercel project.

**www is not live on muco-v1** — canonical domain remains on legacy project per Phase 4.25.
