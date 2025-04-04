/*
  # Add RLS policies for lead_files table

  1. Security
    - Enable RLS on lead_files table (already enabled)
    - Add policy for admins to have full access
    - Add policy for users to manage files for their assigned leads
*/

-- Policy for admins to have full access to lead files
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

-- Policy for users to manage files for their assigned leads
CREATE POLICY "Users can manage files for their assigned leads"
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