/*
  # Add Customer Management

  1. New Tables
    - `client_customers`: Stores customer information for clients
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `name` (text)
      - `description` (text)
      - `address` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin and user access
*/

CREATE TABLE client_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_customers ENABLE ROW LEVEL SECURITY;

-- Add policy for admin access
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

-- Add policy for users to manage customers for their assigned clients
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

CREATE INDEX idx_client_customers_client ON client_customers(client_id);
