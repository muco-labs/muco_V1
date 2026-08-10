# MUCO LABS — Authentication (Step 8)

## Provider

**Supabase Auth** handles credentials (email/password, verification, recovery, sessions). Application `users` rows link via `users.auth_user_id` = `auth.users.id`. Passwords are **not** stored in application tables.

## Environment

| Variable | Scope |
|----------|--------|
| `VITE_SUPABASE_URL` | Browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser (anon/publishable key) |
| `VITE_AUTH_REDIRECT_URL` | Optional base for email links (defaults to current origin) |
| `SUPABASE_URL` | Server (same project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — invites, JWT validation, admin auth APIs |
| `AUTH_REDIRECT_URL` | Server invite/reset redirect fallback |
| `AUTH_INVITE_REDIRECT_URL` | Employee/founder invite completion URL |
| `FOUNDER_BOOTSTRAP_SECRET` | One-time bootstrap for founder invite endpoint |

Configure redirect URLs in the Supabase dashboard for local, preview, and production origins.

### Production OAuth redirect URLs (required)

Allow these callback paths on the same Supabase project:

- `https://www.mucolabs.com/auth/callback`
- `https://mucolabs.com/auth/callback` (apex redirects to www with query preserved)
- `https://app.mucolabs.com/auth/callback`
- `https://team.mucolabs.com/auth/callback`
- `https://freelancers.mucolabs.com/auth/callback`
- `https://admin.mucolabs.com/auth/callback`

Vercel Production:

- `VITE_AUTH_REDIRECT_URL=https://www.mucolabs.com` (marketing OAuth; portal hosts use their own origin at runtime)
- `CORS_ORIGINS` must include all portal origins listed in deployment docs

Portal subdomains expose `/auth/*` and portal sign-in routes **outside** `ProtectedPortal` so sign-in pages render when unauthenticated.

### Google sign-in (Firebase Auth + Supabase session)

Marketing sign-up/sign-in uses **Firebase Authentication** for the Google popup when `VITE_FIREBASE_*` env vars are set. The Google ID token is exchanged for a **Supabase session** via `signInWithIdToken`, so the API and `users.auth_user_id` model stay unchanged.

Required client env:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

In Firebase Console: enable Google sign-in for the web app. Use the **same Google OAuth client** (or matching client ID) in Supabase Auth → Google provider so ID tokens are accepted.

If Firebase vars are missing, Google falls back to Supabase hosted OAuth redirect.

## Founder bootstrap (not public signup)

1. Set `FOUNDER_BOOTSTRAP_SECRET` in the server environment (long random value; never commit).
2. Run migrations and `npm run db:seed` in development to create roles/permissions.
3. Call once (from a secure machine):

```http
POST /api/v1/admin/bootstrap/founder
Content-Type: application/json

{
  "email": "founder@your-domain.com",
  "fullName": "Founder Name",
  "bootstrapSecret": "<FOUNDER_BOOTSTRAP_SECRET>"
}
```

4. Founder completes the Supabase invitation email, sets their own password, and signs in at `/admin/sign-in`.

Do not hard-code founder credentials in the repository.

## Employee invitation

`POST /api/v1/admin/employees/invite` (requires `employees.create`, admin session). Uses Supabase `inviteUserByEmail` server-side. Admin never sees the employee password.

## Row Level Security

Migration `0002_row_level_security.sql` enables customer-scoped RLS for direct Supabase/Postgres client access. The Hono API enforces roles/permissions when using the service role connection.

## Account status

`pending` / `invited` → `active` after email verification (customers and invited staff). `suspended` / `disabled` / `inactive` block API access via `loadAuthContext`.
