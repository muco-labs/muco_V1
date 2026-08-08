-- Employee portal RLS: assignment-scoped access.

CREATE OR REPLACE FUNCTION public.current_employee_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM employee_profiles WHERE user_id = public.current_app_user_id() LIMIT 1;
$$;

DROP POLICY IF EXISTS employee_profiles_update_own ON employee_profiles;
CREATE POLICY employee_profiles_update_own ON employee_profiles
  FOR UPDATE
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS project_members_select_employee ON project_members;
CREATE POLICY project_members_select_employee ON project_members
  FOR SELECT
  USING (employee_id = public.current_employee_profile_id());

DROP POLICY IF EXISTS projects_select_assigned_employee ON projects;
CREATE POLICY projects_select_assigned_employee ON projects
  FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_members
      WHERE employee_id = public.current_employee_profile_id()
    )
  );

DROP POLICY IF EXISTS tasks_select_assigned_employee ON tasks;
CREATE POLICY tasks_select_assigned_employee ON tasks
  FOR SELECT
  USING (
    assigned_employee_id = public.current_employee_profile_id()
    OR project_id IN (
      SELECT project_id FROM project_members
      WHERE employee_id = public.current_employee_profile_id()
    )
  );

DROP POLICY IF EXISTS tasks_update_assigned_employee ON tasks;
CREATE POLICY tasks_update_assigned_employee ON tasks
  FOR UPDATE
  USING (assigned_employee_id = public.current_employee_profile_id())
  WITH CHECK (assigned_employee_id = public.current_employee_profile_id());

DROP POLICY IF EXISTS milestones_select_assigned_employee ON milestones;
CREATE POLICY milestones_select_assigned_employee ON milestones
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE employee_id = public.current_employee_profile_id()
    )
  );

DROP POLICY IF EXISTS files_select_assigned_employee ON files;
CREATE POLICY files_select_assigned_employee ON files
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE employee_id = public.current_employee_profile_id()
    )
  );

DROP POLICY IF EXISTS files_insert_assigned_employee ON files;
CREATE POLICY files_insert_assigned_employee ON files
  FOR INSERT
  WITH CHECK (
    uploaded_by_user_id = public.current_app_user_id()
    AND project_id IN (
      SELECT project_id FROM project_members
      WHERE employee_id = public.current_employee_profile_id()
    )
  );
