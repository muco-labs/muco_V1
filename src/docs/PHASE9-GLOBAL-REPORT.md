# Phase 9 — Global expansion report

## Summary

Phase 9 adds **`/international`** hub, voluntary **country** and **time zone** on leads, **international** CRM segment with Tier 1 market filters, **international admin dashboard**, **proposal `currency`** column (INR default), pricing note for global buyers, and audit/playbook docs. No country doorway pages or fake offices.

## Migrations

- `0012_lead_international_geo.sql` — `business_country`, `contact_timezone`
- `0013_proposal_currency.sql` — `proposals.currency` default INR

Run `npm run db:migrate` on deployed environments.

## APIs

- `GET /api/v1/admin/local/international-dashboard`
- `GET /api/v1/admin/leads?locality=international&market=us` (optional market)

## Validation

`npm run lint`, `npm test`, `npm run build`

## Stop

Phase 10+ not started.

## Manual follow-up

See `PHASE9-GLOBAL-MARKET-AUDIT.md` for payments, tax, privacy, and additional providers.
