# Phase 4.12 — Communication foundation (internal)

## Audit summary

- **Legacy `messages` table**: internal user-to-user / project messages (employee portal). Not suitable for threaded customer ↔ MUCO chat.
- **`leadInteractions` / `leadNotes` / `leadActivities`**: CRM-internal only; not exposed to customers.
- **`supportTickets` / `supportTicketReplies`**: separate helpdesk-style flow; retained unchanged.
- **Notifications + audit logs**: reused for team/customer alerts and conversation lifecycle events.

## Decision

Added dedicated `customer_conversations` and `customer_conversation_messages` tables with open/closed status, context links (project, request/lead, proposal), read tracking, and customer-visible message flag for internal note separation.

## Database

Migration: `server/db/migrations/0022_customer_conversations.sql`

## APIs

Customer: `/api/v1/customer/conversations` (+ messages, read, close)

Admin: `/api/v1/admin/conversations` (+ messages, read, close/reopen via status body)

Legacy `/messages` endpoints remain for internal DM model.

## Pagination

Conversation detail loads the latest 50 messages (chronological display). Older history pagination deferred.

## Browser E2E

Not available in this environment.

## Intentionally excluded

Attachments, rich text, realtime presence, email automation, WhatsApp/SMS, AI bots.
