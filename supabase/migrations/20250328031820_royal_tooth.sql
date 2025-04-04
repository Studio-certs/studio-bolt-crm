/*
  # Add Customers Table

  1. New Tables
    - `client_customers`: Stores potential customer contacts for clients
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `date_of_contact` (timestamptz)
      - `created_at` (timestamptz)
      - `created_by` (uuid)

  2. Security
    - Enable RLS
    - Add policy for users to manage customers for assigned clients
*/

CREATE TABLE client_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  date_of_contact timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id)
);

ALTER TABLE client_customers ENABLE ROW LEVEL SECURITY;

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
