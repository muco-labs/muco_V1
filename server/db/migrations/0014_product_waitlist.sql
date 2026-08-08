-- Phase 10: product interest waitlist (validation, not production customers)

CREATE TABLE IF NOT EXISTS "product_waitlist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_slug" text NOT NULL,
  "email" text NOT NULL,
  "full_name" text,
  "company" text,
  "use_case" text,
  "marketing_consent" boolean NOT NULL DEFAULT false,
  "source_path" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_waitlist_product_email_idx"
  ON "product_waitlist" ("product_slug", "email");

CREATE INDEX IF NOT EXISTS "product_waitlist_product_slug_idx"
  ON "product_waitlist" ("product_slug");

CREATE INDEX IF NOT EXISTS "product_waitlist_created_at_idx"
  ON "product_waitlist" ("created_at");
