/*
  # Update Lead Todos Policies

  1. Changes
    - Drop existing policy
    - Add policy for admin access
    - Add policy for regular users to manage their own todos
    - Add policy for users to view all todos for leads they created

  2. Security
    - Admins have full access to all todos
    - Regular users can:
      - View all todos for leads they created
      - Create and manage their own todos
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage todos for assigned leads" ON lead_todos;

-- Add policy for admin access
CREATE POLICY "Admins have full access to todos"
  ON lead_todos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for users to manage their own todos
CREATE POLICY "Users can manage their own todos"
  ON lead_todos
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM client_leads cl
      JOIN client_users cu ON cu.client_id = cl.client_id
      WHERE cl.id = lead_todos.lead_id
      AND cl.created_by = auth.uid()
    )
  );
