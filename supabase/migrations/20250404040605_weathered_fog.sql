/*
  # Fix lead files policies

  1. Changes
    - Drop existing policies if they exist
    - Recreate policies with updated conditions
  
  2. Security
    - Maintain same security model
    - Ensure proper access control for admins and users
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins have full access to lead files" ON lead_files;
  DROP POLICY IF EXISTS "Users can manage files for their assigned leads" ON lead_files;
  DROP POLICY IF EXISTS "Users can manage files for their accessible leads" ON lead_files;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Add policy for admin access
CREATE POLICY "Admins have full access to lead files"
  ON lead_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for users to manage files for accessible leads
CREATE POLICY "Users can manage files for their accessible leads"
  ON lead_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_leads cl
      WHERE cl.id = lead_files.lead_id
      AND (
        -- User created the lead OR
        cl.created_by = auth.uid()
        OR
        -- User is assigned to the client of the lead
        EXISTS (
          SELECT 1
          FROM client_users cu
          WHERE cu.client_id = cl.client_id
          AND cu.user_id = auth.uid()
        )
      )
    )
  );