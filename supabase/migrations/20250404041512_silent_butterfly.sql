/*
  # Fix Lead Files Policies

  1. Changes
    - Drop existing policies
    - Add simplified admin policy that only checks admin role
    - Add user policy for managing files
  
  2. Security
    - Admins have unconditional access to all files
    - Users can manage files for leads they have access to
*/

-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins have full access to lead files" ON lead_files;
  DROP POLICY IF EXISTS "Users can manage files for their accessible leads" ON lead_files;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Simple admin policy - only checks admin role
CREATE POLICY "Admins have full access to lead files"
  ON lead_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- User policy for managing files
CREATE POLICY "Users can manage files for their leads"
  ON lead_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_leads cl
      JOIN client_users cu ON cu.client_id = cl.client_id
      WHERE cl.id = lead_files.lead_id
      AND cu.user_id = auth.uid()
    )
  );
