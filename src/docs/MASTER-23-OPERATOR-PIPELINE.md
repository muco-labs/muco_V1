# MASTER 23 — Operator execution pipeline

Execute top-to-bottom. Do not skip **Founder** before **Employee** invites. Record evidence (screenshots, HTTP status, MUCO IDs) — never passwords or secret values.

```text
MASTER 22 (docs committed)
   ↓
OPERATOR CONFIGURATION  ← open MASTER-22-PRODUCTION-OPERATOR-CHECKLIST.md
   ↓
Vercel (Production env + redeploy)
   ↓
Supabase (Auth URLs, providers, migration 0029, storage bucket)
   ↓
Founder account (one-time bootstrap)
   ↓
Test Customer A / Customer B
   ↓
Employee (admin invite)
   ↓
Freelancer (apply → approve → link)
   ↓
Google OAuth (Supabase provider + browser)
   ↓
GitHub OAuth (Supabase provider + browser)
   ↓
Email (Supabase auth mail + optional Resend)
   ↓
Razorpay (keys + webhook smoke)
   ↓
Storage (bucket + upload/download)
   ↓
LIVE BROWSER QA (all portals)
   ↓
IDOR / ROLE ISOLATION (SECURITY_GATE_RUN + bearers)
   ↓
FINAL SECURITY (full test suite + gate report)
```

## Quick gates per stage

| Stage | Done when |
|-------|-----------|
| Vercel | `FOUNDER_BOOTSTRAP_SECRET`, `SUPABASE_ANON_KEY` (or alias), Supabase keys, redirects; Production redeployed |
| Supabase | Five host redirect URLs; Google/GitHub enabled if testing OAuth; `users.muco_login_id` column present |
| Founder | Bootstrap `201` once; founder signed in at `admin.mucolabs.com`; `FOUNDER` role |
| Customer A/B | Two `CUSTOMER` rows; MUCO IDs recorded; sign-in on `app.mucolabs.com` |
| Employee | `EMPLOYEE_A` invited and active on `team.mucolabs.com` |
| Freelancer | `FREELANCER_A` approved + linked; `FREELANCER_UNAPPROVED` blocked at portal |
| OAuth | Each provider: sign-in → `/auth/callback` → customer registration path |
| Email | Test inbox receives verify/invite/recovery (test addresses only) |
| Razorpay | Order create + webhook signature path (sandbox or policy-approved live) |
| Storage | Bucket exists; customer file upload/download smoke |
| Browser QA | Matrix in PHASE4.50 report §Live browser |
| IDOR | `SECURITY_GATE_RUN=1` + bearer env vars; vitest live gate green |
| Final security | `npm test`, `npm run lint`, `npm run build`; no fabricated PASS |

## Commands (after identities exist)

```bash
node scripts/master-23-operator-pipeline-probe.mjs

SECURITY_GATE_RUN=1 npx vitest run server/security/auth-gate.live.test.ts server/security/master-12-gate.test.ts
```

## References

- Checklist: [`MASTER-22-PRODUCTION-OPERATOR-CHECKLIST.md`](./MASTER-22-PRODUCTION-OPERATOR-CHECKLIST.md)
- MASTER 22 report: [`PHASE4.49-PRODUCTION-OPERATOR-CONFIGURATION-MASTER-REPORT.md`](./PHASE4.49-PRODUCTION-OPERATOR-CONFIGURATION-MASTER-REPORT.md)
- MASTER 23 report: [`PHASE4.50-PRODUCTION-LIVE-OPERATOR-EXECUTION-MASTER-REPORT.md`](./PHASE4.50-PRODUCTION-LIVE-OPERATOR-EXECUTION-MASTER-REPORT.md)
- Founder bootstrap: `server/docs/AUTH.md`
