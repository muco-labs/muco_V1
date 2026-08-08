-- Phase 10: SaaS tenant foundation (separate from MUCO delivery customer_profiles)

DO $$ BEGIN
  CREATE TYPE "product_org_status" AS ENUM ('active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "product_org_member_role" AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "product_organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "status" "product_org_status" NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_organizations_slug_idx"
  ON "product_organizations" ("slug");

CREATE TABLE IF NOT EXISTS "product_organization_members" (
  "organization_id" uuid NOT NULL REFERENCES "product_organizations" ("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "role" "product_org_member_role" NOT NULL DEFAULT 'member',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "product_organization_members_pkey" PRIMARY KEY ("organization_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "product_organization_members_user_id_idx"
  ON "product_organization_members" ("user_id");

-- RLS: defense in depth; server API remains primary authorization layer.

ALTER TABLE "product_waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_organization_members" ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies on waitlist (server-only writes/reads).

CREATE OR REPLACE FUNCTION public.current_product_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.organization_id
  FROM product_organization_members m
  INNER JOIN users u ON u.id = m.user_id
  WHERE u.auth_user_id = auth.uid();
$$;

DROP POLICY IF EXISTS product_organizations_select_member ON product_organizations;
CREATE POLICY product_organizations_select_member ON product_organizations
  FOR SELECT
  USING (id IN (SELECT public.current_product_organization_ids()));

DROP POLICY IF EXISTS product_organization_members_select_same_org ON product_organization_members;
CREATE POLICY product_organization_members_select_same_org ON product_organization_members
  FOR SELECT
  USING (organization_id IN (SELECT public.current_product_organization_ids()));
