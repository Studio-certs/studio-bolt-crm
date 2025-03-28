/*
  # Update Lead Chatter Policies

  1. Changes
    - Drop existing policy
    - Add policy for admin access
    - Add policy for regular users to manage chatter for their assigned leads

  2. Security
    - Admins have full access to all chatter
    - Regular users can:
      - View and add chatter for leads they're assigned to
      - Cannot modify or delete others' messages
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage chatter for assigned clients' leads" ON lead_chatter;

-- Add policy for admin access
CREATE POLICY "Admins have full access to chatter"
  ON lead_chatter
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for regular users
CREATE POLICY "Users can manage chatter for assigned leads"
  ON lead_chatter
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_leads cl
      JOIN client_users cu ON cu.client_id = cl.client_id
      WHERE cl.id = lead_chatter.lead_id
      AND cu.user_id = auth.uid()
    )
  );