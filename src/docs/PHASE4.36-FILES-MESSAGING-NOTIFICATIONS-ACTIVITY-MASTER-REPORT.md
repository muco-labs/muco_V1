# Phase 4.36 — Files, messaging, notifications & activity (MASTER 10)

## 1. Executive summary

MASTER 10 **audited** the real cross-platform communication layer (files, customer conversations, notifications, audit/activity) across customer, employee, freelancer, and admin portals. Work focused on **evidence-based hardening and shared UX**—not new storage, chat, or notification backends.

**Delivered in code:**

- Shared portal primitives: file list row, message article (plain-text safe), notification list with **known-type** deep links only.
- **Admin notifications API + UI** wired to existing `notifications` table (was placeholder UI).
- Message body normalization (null-byte strip), audit metadata safety helper + tests, notification recipient scope tests.
- Customer project documents: friendly errors + shared file formatting.

**Status: MASTER 10 — READY WITH LIMITATIONS**

Live authenticated IDOR tests, storage bucket verification, and responsive browser QA remain **BLOCKED** without admin/customer sessions and confirmed Supabase storage (MASTER 04.1).

---

## 2. Existing architecture (map)

| Area | DB / storage | Server services | APIs | Customer UI | Employee UI | Freelancer UI | Admin UI |
|------|----------------|-----------------|------|-------------|-------------|---------------|----------|
| **Project files** | `files`, Supabase bucket (`SUPABASE_STORAGE_BUCKET` → default `customer-files`) | `project-files.service.ts`, parts of `customer.service.ts`, `employee.service.ts` | `/api/v1/customer/projects/:id/files/*`, `/employee/...`, `/admin/projects/:id/files/*` | `ProjectDocumentsSection` | Project detail files (if routed) | **None** | `AdminProjectFilesSection` |
| **Customer messaging** | `customer_conversations`, `customer_conversation_messages` | `customer-conversation.service.ts` | Customer + admin conversation routes | `/app/messages` | **No customer conversation UI** | **None** | `/admin/messages` |
| **Internal messages** | `messages` (legacy/project) | `employee.service.ts`, `admin.service.ts` | `/employee/messages`, admin messages list | **None** | `/team/messages` (basic list) | **None** | Legacy list in admin service |
| **Notifications** | `notifications` | Many domain services insert rows | Customer, employee, **admin** (added MASTER 10) | `/app/notifications` | `/team/notifications` | **None** | `/admin/notifications` |
| **Activity (user-facing)** | Derived from CRM interactions + proposals | `leads.service.ts`, CRM pages | Lead activity endpoints | Project/request timelines | — | — | CRM timeline, dashboard `recentActivity` |
| **Audit (admin)** | `audit_logs` | Widespread inserts | `GET /api/v1/admin/audit-logs` | **Not exposed** | **Not exposed** | **Not exposed** | Audit logs page |

---

## 3. File architecture

**Lifecycle (project files):**

1. **Prepare** — Server validates name/size/MIME, inserts `files` row (`pending`), returns short-lived signed **upload** URL (Supabase).
2. **Upload** — Client `PUT` to signed URL (no service role in browser).
3. **Finalize** — Server marks `active`, may notify admins/customers.
4. **List** — Scoped by project ownership / assignment / admin permission.
5. **Download** — Server checks row + visibility, returns signed URL (`SIGNED_DOWNLOAD_TTL_SECONDS` ≤ 300s).
6. **Delete / archive** — Admin paths in `project-files.service.ts` (customer cannot delete per RBAC).

**Path convention:** `buildProjectStorageKey` → `projects/{projectId}/...` (`server/lib/files/project-file.ts`).

---

## 4. Storage architecture

- **Integration:** `@supabase/supabase-js` via `getSupabaseAdmin()` only on server.
- **Bucket:** `serverEnv.storageBucket` (env `SUPABASE_STORAGE_BUCKET`, default `customer-files`).
- **Expected pattern:** private bucket + server authorization + short-lived signed URLs.
- **Blocker if bucket missing:** prepare/download returns `configured: false` or 503; **not fabricated** in UI.

---

## 5. File security (source audit)

| Check | Mechanism |
|-------|-----------|
| Customer A → B project | `getOwnedProject(customerId, projectId)` before file ops |
| Wrong `fileId` / `projectId` | `getActiveProjectFile(projectId, fileId)` — 404 |
| Internal file to customer | `isCustomerVisibleFile` — 404 on download |
| Employee access | `assertProjectAccess` / assigned projects |
| Admin | `requirePermission` + admin file service |
| IDOR via client IDs | Server ignores client ownership claims; uses auth context |
| Signed URL misuse | TTL capped; URLs not logged in app code paths reviewed |

**Tests:** `server/lib/files/project-file.test.ts` (validation, visibility, RBAC, TTL).

---

## 6. File UX

- Shared `formatFileSize`, `PortalFileListItem`, upload status `aria-live`, no fake progress (binary PUT then finalize).
- Customer documents: improved error copy via `friendlyCustomerPortalError`.

---

## 7. Messaging architecture

**Primary product messaging:** customer ↔ MUCO **conversations** (`customer_conversation_*`), context-linked to project, intake lead, or proposal.

**Secondary:** `messages` table for employee/admin operational messages (not full chat product).

**Freelancer portal:** no messaging module (by design in repo).

---

## 8. Messaging security

- Conversation access: `getOwnedConversation` (customer), admin permission + service checks.
- Customer DTOs omit internal IDs; `customerVisible: false` messages throw on serialize (tested).
- Sender identity from server `senderType`, not client `senderId`.
- Duplicate send window: `isRecentDuplicateMessage`.

**Tests:** `server/services/customer-conversation-access.test.ts`.

---

## 9. Messaging UX

- `PortalMessageArticle`: pre-wrap plain text, unread labels with `aria-label`.
- Applied on customer, admin conversation detail, employee message list.

---

## 10. Message content security

- Bodies rendered as **React text children** (escaped); no `dangerouslySetInnerHTML` on messages.
- `normalizeMessageBody` strips `\0` before persistence/display.

---

## 11. Notification architecture

```
Domain event (service) → insert notifications (userId, type, title, message)
→ GET /notifications (scoped by auth.userId)
→ PATCH .../read (userId + id)
```

Real types include: `conversation.*`, `project.file_uploaded`, `task.assigned`, `crm.lead_assigned`, `payment.*`, `freelancer.*`, etc. (see grep on `type:` in `server/services`).

---

## 12. Notification UX

- `PortalNotificationList` + `notificationHref()` — links only for **known** types; `null` → no link (avoids dead URLs).
- Timestamps, read/unread text (not color-only).

---

## 13. Notification security

- All list/read updates: `eq(notifications.userId, auth.userId)` (customer, employee, **admin**).
- `notificationBelongsToUser` helper + unit test documents invariant.

---

## 14. Activity architecture (user-facing)

- CRM lead timelines (`CrmActivityTimeline`, lead interactions + audit-derived labels).
- Admin dashboard `recentActivity` from DB.
- Project workflow audit entries via `workflow.service.ts` (admin-facing).

---

## 15. Audit architecture

- `audit_logs`: actor, action, entity, entityId, metadata JSON.
- Admin audit UI + automation log section.
- **Not** shown to customers as a security log.

---

## 16. Audit security

- New `safe-audit-metadata.ts`: rejects credential-like keys and connection strings in metadata (guardrail for future inserts).
- Existing inserts reviewed for file/message flows — operational IDs only, no passwords/tokens.

---

## 17. Cross-platform visibility matrix

| Resource | Customer | Employee | Freelancer | Admin |
|----------|----------|----------|------------|-------|
| Own uploaded project files | Yes (own projects) | Via assigned project | No | All (permission) |
| Project deliverables (customer_visible) | Yes | Assigned projects | No | Yes |
| Internal project files | No | If on project team | No | Yes |
| Customer conversations | Own threads | No UI | No | Yes (`messages.view`) |
| Internal `messages` table | No | List/send (limited) | No | List |
| In-app notifications | Yes | Yes | **No UI/API** | Yes (MASTER 10) |
| CRM / lead activity | Own requests | No | No | Yes |
| Security audit log | No | No | No | `audit_logs.view` |

Permissions from `defaultRolePermissions` + route middleware — not invented.

---

## 18. Shared UX system

| Primitive | Path |
|-----------|------|
| File size | `src/lib/portal/format-file-size.ts` |
| File row | `PortalFileListItem.tsx` |
| Message bubble | `PortalMessageArticle.tsx` |
| Notifications | `PortalNotificationList.tsx` |
| Notification routes | `notification-links.ts` |
| Errors | Existing `friendly*PortalError` |

---

## 19. Responsive QA

**BLOCKED** (no authenticated sessions). Layout uses existing portal CSS stacks; no new wide tables in MASTER 10 scope.

---

## 20. Accessibility

- Upload status `role="status"` / `aria-live="polite"`.
- Unread notifications/messages: text + `aria-label`.
- Message lists: `aria-live="polite"` on customer conversation (existing).

---

## 21. Performance

- No new polling. Notification lists capped at 100 server-side.
- Signed URLs generated on demand per download.

---

## 22. Tests

```
npx vitest run --pool=threads --maxWorkers=2
→ 411 passed, 2 skipped (76 files)
```

New/extended: `recipient-scope.test.ts`, `safe-audit-metadata.test.ts`, `notification-links.test.ts`, conversation null-byte, file oversize.

**Note:** If `DATABASE_URL` is set in the shell, legacy tests expecting “no DB” may fail — run tests without DB env for CI parity.

---

## 23. Lint

`npm run lint` → **0 warnings**.

---

## 24. Build

`npm run build` → **PASS**.

---

## 25. Browser QA

| Area | Result |
|------|--------|
| Public routes (`/`, `/services`, `/contact`, `/start-project`, sign-in) | Not re-run live this session |
| Portal file/message/notification UIs | **BLOCKED** (auth) |
| API health | Not re-run |

---

## 26. Security QA

| Test | Result |
|------|--------|
| Live IDOR (files/messages/notifications) | **BLOCKED** |
| Source audit + unit tests | **PASS** |

---

## 27. Blocked items

- Supabase storage bucket existence / RLS policies (dashboard verification).
- Live signed URL expiry behavior.
- Freelancer notifications/messages/files (not in product scope).
- Admin notification deep links are module-level, not entity-id level (no `entityId` on notification rows).

---

## 28. Remaining limitations

- Employee messaging is not the customer conversation system — intentional dual model.
- Admin legacy `messages` table vs `customer_conversations` coexist.
- Migration drift on remote DB (operator environment) unrelated to MASTER 10 code.

---

## 29. Production readiness

**READY WITH LIMITATIONS** for communication layer code quality and server scoping patterns. Production go-live still depends on storage bucket config, auth bootstrap, and live security gate (MASTER 04.1).

---

## Files touched (MASTER 10)

- `server/services/admin.service.ts`, `server/routes/v1/admin.ts`
- `src/services/admin-portal.ts`
- `src/components/portal/ProjectDocumentsSection.tsx`, `PortalFileListItem.tsx`, `PortalMessageArticle.tsx`, `PortalNotificationList.tsx`
- `src/lib/portal/*`, `server/lib/notifications/*`, `server/lib/audit/safe-audit-metadata.ts`
- `server/lib/communication/customer-conversation.ts`
- Portal pages: customer, employee, admin (notifications/messages)
- Tests + this report
