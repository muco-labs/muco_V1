# PHASE 4.42 — Authentication, Sign-In, Sign-Up, Google/GitHub OAuth, Session Security & Portal Routing (MASTER 15)

**Date:** 2026-08-09  
**Verdict:** **READY WITH LIMITATIONS**  
**OAuth E2E:** **BLOCKED** (Supabase Google/GitHub provider dashboard not verified in this session)

---

## 1. Executive summary

MASTER 15 audited the existing Supabase + RBAC architecture and extended it with **production-oriented customer auth UX**, **Google/GitHub OAuth (Supabase `signInWithOAuth`)**, a secure **`/auth/callback`** route, **server-controlled portal routing** after login, **password show/hide**, **confirm password on sign-up**, **friendly auth errors**, and **regression tests**.

**Preserved:** `loadAuthContext`, `requirePortal`, `requirePermission`, `registerCustomerFromAuth` (CUSTOMER role only), freelancer approval rules, bearer API auth, no client-side role trust.

**Not claimed:** Live Google/GitHub login, provider dashboard configuration, or full browser E2E with real OAuth credentials.

---

## 2. Existing auth architecture

```
Browser (AuthProvider, Supabase JS)
  → signInWithPassword / signInWithOAuth
  → session (persistSession, autoRefreshToken, detectSessionInUrl)
  → Bearer token on API requests
  → GET /api/v1/auth/me
  → loadAuthContext + resolvePortalAccessFlags
  → ProtectedPortal (UX guard; API enforces)
```

Key files: `src/contexts/AuthProvider.tsx`, `src/services/auth.ts`, `server/middleware/authenticate.ts`, `server/routes/v1/auth.ts`, `server/lib/auth/portal-access.ts`, `src/components/auth/ProtectedPortal.tsx`.

---

## 3. Environment audit

Script: `node scripts/master-15-auth-discovery.mjs`

| Variable | Local (.env.local) |
|----------|-------------------|
| `VITE_SUPABASE_URL` | PRESENT |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | PRESENT |
| `SUPABASE_URL` | PRESENT |
| `SUPABASE_SERVICE_ROLE_KEY` | PRESENT |
| `VITE_AUTH_REDIRECT_URL` | MISSING (runtime uses `window.location.origin`) |

OAuth client secrets: **not in repo** (correct).

---

## 4. Supabase provider status

| Provider | Status |
|----------|--------|
| Google | **EXTERNAL CONFIGURATION REQUIRED** |
| GitHub | **EXTERNAL CONFIGURATION REQUIRED** |

Enable in Supabase Dashboard → Authentication → Providers. Cannot verify PASS without dashboard access.

---

## 5–6. Sign-in / Sign-up

**Updated:** `AuthSignInPage`, `AuthSignUpPage`

- MUCO LABS brand label + “Welcome back” / “Create your account”
- Email/password with **PasswordField** (show/hide, accessible toggle)
- Primary CTA + **or** separator + **Continue with Google/GitHub**
- Forgot password / cross-links
- Sign-up: **confirm password**, min length 8
- Errors via `friendlyAuthError` (no stack traces)

Team/admin sign-in pages remain **email/password** (staff entry points).

---

## 7–8. Google & GitHub OAuth (code)

`signInWithOAuth('google' | 'github')` in `src/services/auth.ts` using Supabase OAuth only.

- Redirect: `{origin or VITE_AUTH_REDIRECT_URL}/auth/callback`
- No custom token handling, no client secrets

---

## 9. OAuth callback

Route: **`/auth/callback`** (`AuthCallbackPage`)

1. Read session (`detectSessionInUrl`)
2. If unregistered → `POST /api/v1/auth/register` with name from OAuth metadata ( **CUSTOMER** provisioning only )
3. `GET /api/v1/auth/me`
4. `resolvePostAuthDestination` → navigate

Return path: `sessionStorage` via `persistOAuthReturnPath` / `consumeOAuthReturnPath`.

---

## 10. Account provisioning (OAuth-first)

`ensureCustomerRegistrationFromOAuthUser` → existing `registerCustomerFromAuth` (idempotent if user exists). **Does not** assign ADMIN/EMPLOYEE/FREELANCER from OAuth metadata.

---

## 11–12. Account linking

Automatic provider linking follows **Supabase** behavior. No custom unauthenticated linking. Duplicate email edge cases: Supabase + existing `users.authUserId` uniqueness — **REQUIRES REVIEW** in production with real providers.

---

## 13. Role resolution

**Server-only** via `loadAuthContext` and `/auth/me`. Client `resolvePostAuthDestination` uses **`profile.portals`** from API only.

---

## 14. Portal routing

`resolvePostAuthDestination` priority:

1. Unregistered → `/auth/sign-up`
2. Non-active status → `/auth/verify-email`
3. Safe `/app/*` deep link if customer portal allowed
4. Admin → `/admin`, Employee → `/team`, Freelancer → `/app/freelancer`, Customer → `/app`
5. Pending freelancer → `/freelancers/apply`
6. Else → `/auth/unauthorized`

Password sign-in uses same resolver (replacing customer-only `resolveSafeCustomerReturnPath` alone).

---

## 15. Return-to security

Existing `resolveSafeCustomerReturnPath` unchanged (blocks external URLs, `//`, non-`/app` paths, traversal).

OAuth return path stored only as internal string from router state.

---

## 16–17. Logout / sessions

`AuthProvider.signOut` → Supabase `signOut` + clear profile. `onAuthStateChange` updates session. Automated boundary tests cover unauthenticated API access (MASTER 12 / 04.1).

---

## 18–19. Password reset / email verification

Existing pages: `AuthForgotPasswordPage`, `AuthResetPasswordPage`, `AuthVerifyEmailPage` — unchanged logic; safe copy on forgot flow.

---

## 20. Error handling

`src/lib/auth/auth-errors.ts` — maps common Supabase messages to user-safe copy.

---

## 21–22. Accessibility / responsive

- Labels, `role="alert"` on errors, password toggle `aria-label` / `aria-pressed`
- `autocomplete` on email/password/name
- Form layout uses existing design tokens; OAuth buttons stack on narrow viewports (CSS grid)

Full multi-viewport browser matrix: **not executed** in this session.

---

## 23. Security tests

Added/extended:

- `post-auth-destination.test.ts`
- `auth-errors.test.ts`
- `oauth-return-path.test.ts`
- Existing: `safe-return-path.test.ts`, `master-12-gate`, `auth-gate.live`, `client-bundle-secrets`

---

## 24. Browser E2E

| Flow | Status |
|------|--------|
| Email signup/login | **BLOCKED** (no dedicated test user in env) |
| Google | **GOOGLE E2E — BLOCKED** |
| GitHub | **GITHUB E2E — BLOCKED** |

---

## 25. Bundle / secret audit

No OAuth client secrets in `src/`. `client-bundle-secrets.test.ts` guards server secret names in client tree.

---

## 26. Provider configuration requirements (operator)

**Supabase → Authentication → URL configuration**

- Site URL: `https://www.mucolabs.com` (production)
- Redirect URLs (add both):
  - `https://www.mucolabs.com/auth/callback`
  - `https://muco-v1.vercel.app/auth/callback`
  - (optional) `http://localhost:5173/auth/callback` for local dev

**Google Cloud Console** (if using Google provider)

- Authorized JavaScript origins: `https://www.mucolabs.com`, `https://muco-v1.vercel.app`, `http://localhost:5173`
- Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback` (from Supabase provider settings)

**GitHub OAuth App**

- Homepage: `https://www.mucolabs.com`
- Authorization callback URL: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

**CODE COMPLETE** ≠ **PROVIDER DASHBOARD CONFIGURATION REQUIRED**

---

## 27–28. Regression

```
npx vitest run --pool=threads --maxWorkers=2 → 449 passed, 2 skipped (451)
npm run lint → 0 issues
npm run build → PASS
```

---

## 29. Blockers

1. Google/GitHub providers not verified in Supabase dashboard  
2. No live OAuth E2E  
3. `VITE_AUTH_REDIRECT_URL` not set for muco-v1 (origin fallback works for same-host callback)

---

## 30. Remaining work

- Operator: enable Google + GitHub in Supabase; add redirect URLs  
- Provision `SECURITY_GATE_*` users; run email/password E2E  
- Optional: OAuth on team/admin pages (currently password-only by design)  
- Playwright auth smoke in CI

---

## 31. Final status

| Criterion | Status |
|-----------|--------|
| Architecture preserved | Yes |
| Email/password UX | Enhanced |
| OAuth code path | Complete |
| Callback + provisioning | Complete |
| RBAC / freelancer approval | Preserved |
| OAuth E2E PASS | No |

**MASTER 15:** **READY WITH LIMITATIONS**
