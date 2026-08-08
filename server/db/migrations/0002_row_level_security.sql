-- Row Level Security for Supabase Auth (auth.uid()).
-- Apply when DATABASE_URL points at Supabase Postgres.
-- Server API uses service role / direct connection with app-layer authorization.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proposals" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_customer_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM customer_profiles WHERE user_id = public.current_app_user_id() LIMIT 1;
$$;

-- Users: read/update own application row only
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Customer profiles
DROP POLICY IF EXISTS customer_profiles_select_own ON customer_profiles;
CREATE POLICY customer_profiles_select_own ON customer_profiles
  FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS customer_profiles_update_own ON customer_profiles;
CREATE POLICY customer_profiles_update_own ON customer_profiles
  FOR UPDATE
  USING (user_id = public.current_app_user_id());

-- Projects owned by customer
DROP POLICY IF EXISTS projects_select_customer ON projects;
CREATE POLICY projects_select_customer ON projects
  FOR SELECT
  USING (customer_id = public.current_customer_profile_id());

-- Files for customer projects
DROP POLICY IF EXISTS files_select_customer ON files;
CREATE POLICY files_select_customer ON files
  FOR SELECT
  USING (
    customer_id = public.current_customer_profile_id()
    OR project_id IN (
      SELECT id FROM projects WHERE customer_id = public.current_customer_profile_id()
    )
  );

-- Invoices / payments
DROP POLICY IF EXISTS invoices_select_customer ON invoices;
CREATE POLICY invoices_select_customer ON invoices
  FOR SELECT
  USING (customer_id = public.current_customer_profile_id());

DROP POLICY IF EXISTS payments_select_customer ON payments;
CREATE POLICY payments_select_customer ON payments
  FOR SELECT
  USING (customer_id = public.current_customer_profile_id());

-- Proposals linked to customer
DROP POLICY IF EXISTS proposals_select_customer ON proposals;
CREATE POLICY proposals_select_customer ON proposals
  FOR SELECT
  USING (customer_id = public.current_customer_profile_id());

-- Messages
DROP POLICY IF EXISTS messages_select_participant ON messages;
CREATE POLICY messages_select_participant ON messages
  FOR SELECT
  USING (
    sender_user_id = public.current_app_user_id()
    OR recipient_user_id = public.current_app_user_id()
  );

DROP POLICY IF EXISTS messages_insert_sender ON messages;
CREATE POLICY messages_insert_sender ON messages
  FOR INSERT
  WITH CHECK (sender_user_id = public.current_app_user_id());

-- Notifications
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (user_id = public.current_app_user_id());

-- Support tickets
DROP POLICY IF EXISTS support_tickets_select_customer ON support_tickets;
CREATE POLICY support_tickets_select_customer ON support_tickets
  FOR SELECT
  USING (customer_id = public.current_customer_profile_id());

DROP POLICY IF EXISTS support_tickets_insert_customer ON support_tickets;
CREATE POLICY support_tickets_insert_customer ON support_tickets
  FOR INSERT
  WITH CHECK (customer_id = public.current_customer_profile_id());

-- Employee profiles: staff read own row
DROP POLICY IF EXISTS employee_profiles_select_own ON employee_profiles;
CREATE POLICY employee_profiles_select_own ON employee_profiles
  FOR SELECT
  USING (user_id = public.current_app_user_id());

-- Service role / migrations bypass RLS when using service key from server.
