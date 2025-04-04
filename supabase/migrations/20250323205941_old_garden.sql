/*
  # Add Todo List Feature

  1. New Tables
    - `lead_todos`: Stores todo items for leads
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references client_leads)
      - `title` (text)
      - `description` (text)
      - `status` (text: pending, completed)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)
      - `created_by` (uuid, references profiles)

  2. Security
    - Enable RLS on lead_todos table
    - Add policy for users to manage todos for assigned leads
*/

CREATE TABLE lead_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES client_leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  CONSTRAINT lead_todos_status_check CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text]))
);

ALTER TABLE lead_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage todos for assigned leads"
  ON lead_todos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      JOIN client_leads cl ON cl.client_id = cu.client_id
      WHERE cl.id = lead_todos.lead_id
      AND cu.user_id = auth.uid()
    )
  );

CREATE INDEX idx_lead_todos_lead ON lead_todos(lead_id);
