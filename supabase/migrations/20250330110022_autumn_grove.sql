/*
  # Fix RLS Policies for Client Customers
  
  1. Changes
    - Drop existing policies
    - Add comprehensive policies for client_customers table
    - Ensure service role has proper access
  
  2. Security
    - Maintain existing security model
    - Add explicit policies for status updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access to customers" ON client_customers;
DROP POLICY IF EXISTS "Users can manage customers for assigned clients" ON client_customers;

-- Add new policies
CREATE POLICY "Admins have full access to customers"
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

CREATE POLICY "Users can manage customers for assigned clients"
  ON client_customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = client_customers.client_id
      AND client_users.user_id = auth.uid()
    )
  );

-- Add explicit policy for service role access
CREATE POLICY "Service role has full access"
  ON client_customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);