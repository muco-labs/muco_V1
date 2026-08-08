# Phase 10 — Product platform architecture

## Product brand

**Recommendation:** Ship under **MUCO LABS** sub-brand (“MUCO Client Hub”) until validation proves standalone brand equity. Avoid final independent identity until paid pilots exist.

## Domain strategy

| Option | Use |
|--------|-----|
| `mucolabs.com/products/client-hub` | **Now** — marketing + waitlist (implemented) |
| `app.clienthub…` or `clienthub.mucolabs.com` | **MVP** — authenticated app subdomain |
| Apex `clienthub.com` | Only after validation + trademark check; **do not auto-register** |

## Multi-tenancy

```
ORGANIZATION (product_organizations)
  └── MEMBERS (product_organization_members: owner | admin | member)
        └── USERS (users.id)
```

Delivery CRM `customer_profiles` remain for MUCO services engagements — **not** SaaS tenants.

Isolation:

1. Every product resource carries `organization_id` (future tables)
2. RLS: `current_product_organization_ids()` (0015)
3. API: resolve org from session membership; never trust client-supplied org id alone
4. Tests: `assertOrganizationScope` + access matrix tests in CI

## Authentication

Reuse Supabase + existing `users` table. Product MVP: email/password only unless a validated customer demands OAuth.

## Waitlist

- Table: `product_waitlist`
- API: `POST /api/v1/product/waitlist` (rate limited, consent required)
- Admin: `GET /api/v1/admin/product/waitlist?productSlug=client-hub` (`settings.manage`)

## Billing (future)

States when needed: `trial`, `active`, `past_due`, `cancelled`, `expired`. Reuse Razorpay webhook patterns from delivery platform.

## Usage limits (future)

Meter on server: AI requests, seats, storage — no client-side counters.

## AI architecture (when Client Hub adds assist)

```
User → App → Server → Provider adapter → Model
                ↓
           Validation + quotas + audit
```

- No browser → provider with secrets
- Human confirmation for financial/permission actions
- Minimize PII in prompts; document processing in privacy policy

## API surface (Phase 10)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/product/waitlist` | Public + rate limit |
| GET | `/api/v1/admin/product/waitlist` | Admin `settings.manage` |

## Observability

Log waitlist failures and 5xx; never log secrets or full PII dumps.

## MVP scope (not built in Phase 10)

Signup → create org → invite → client project → file share → invoice view → support ticket.

Phase 10 delivers **validation surface + tenant skeleton** only.
