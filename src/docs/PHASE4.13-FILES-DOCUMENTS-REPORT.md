# Phase 4.13 — Files & deliverables (internal)

## Audit

- Reused existing `files` table and `customer-files` Supabase bucket (`serverEnv.storageBucket`).
- Careers resumes use separate storage keys under careers namespace — unchanged.
- Customer legacy `/files` routes retained; project-scoped routes added.

## Migration

`0023_project_files_metadata.sql` adds `status` and `updated_at` to `files`.

## Upload limit

25 MB per project file (`PROJECT_FILE_MAX_BYTES`).

## Signed URLs

120 second TTL for downloads (existing convention).

## Browser E2E

Not available.
