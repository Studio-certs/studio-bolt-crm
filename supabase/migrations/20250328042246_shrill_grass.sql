/*
  # Update Client Leads Policy
  
  1. Changes
    - Drop existing policy
    - Add new policy for admin access
    - Add new policy for regular user access
  
  2. Security
    - Admins can see all leads for any client
    - Regular users can only see leads they created
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage leads for assigned clients" ON client_leads;

-- Add policy for admin access
CREATE POLICY "Admins have full access to leads"
  ON client_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for regular user access
CREATE POLICY "Users can manage their own leads"
  ON client_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = client_leads.client_id
      AND client_users.user_id = auth.uid()
    )
    AND (
      created_by = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );