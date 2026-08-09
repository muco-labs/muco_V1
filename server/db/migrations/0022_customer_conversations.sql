-- Phase 4.12: customer ↔ MUCO conversation messaging

DO $$ BEGIN
  CREATE TYPE "customer_conversation_status" AS ENUM ('open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "customer_message_sender_type" AS ENUM ('customer', 'team');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "customer_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid NOT NULL REFERENCES "customer_profiles"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL,
  "lead_id" uuid REFERENCES "leads"("id") ON DELETE SET NULL,
  "proposal_id" uuid REFERENCES "proposals"("id") ON DELETE SET NULL,
  "subject" text NOT NULL,
  "status" "customer_conversation_status" NOT NULL DEFAULT 'open',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "customer_conversations_customer_id_idx" ON "customer_conversations" ("customer_id");
CREATE INDEX IF NOT EXISTS "customer_conversations_updated_at_idx" ON "customer_conversations" ("updated_at");
CREATE INDEX IF NOT EXISTS "customer_conversations_project_id_idx" ON "customer_conversations" ("project_id");
CREATE INDEX IF NOT EXISTS "customer_conversations_lead_id_idx" ON "customer_conversations" ("lead_id");
CREATE INDEX IF NOT EXISTS "customer_conversations_proposal_id_idx" ON "customer_conversations" ("proposal_id");

CREATE UNIQUE INDEX IF NOT EXISTS "customer_conversations_open_project_uidx"
  ON "customer_conversations" ("customer_id", "project_id")
  WHERE "status" = 'open' AND "project_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "customer_conversations_open_lead_uidx"
  ON "customer_conversations" ("customer_id", "lead_id")
  WHERE "status" = 'open' AND "lead_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "customer_conversations_open_proposal_uidx"
  ON "customer_conversations" ("customer_id", "proposal_id")
  WHERE "status" = 'open' AND "proposal_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "customer_conversation_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "customer_conversations"("id") ON DELETE CASCADE,
  "sender_type" "customer_message_sender_type" NOT NULL,
  "sender_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "customer_visible" boolean NOT NULL DEFAULT true,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "customer_conversation_messages_conversation_id_idx"
  ON "customer_conversation_messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "customer_conversation_messages_created_at_idx"
  ON "customer_conversation_messages" ("created_at");
