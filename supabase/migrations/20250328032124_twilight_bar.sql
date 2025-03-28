/*
  # Fix RLS policies for client_customers table

  1. Changes
    - Add policy to allow admin users full access to client_customers table
  
  2. Security
    - Maintains existing policy for regular users
    - Adds admin access policy
*/

-- Add policy for admin access
CREATE POLICY "Admins have full access to client customers"
  ON client_customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );