/*
  # Add Lead Notes Table

  1. New Tables
    - `lead_notes`: Stores timestamped notes for leads
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references client_leads)
      - `content` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)

  2. Security
    - Enable RLS
    - Add policies for admins and users
*/

CREATE TABLE lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES client_leads(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id)
);

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Add policy for admin access
CREATE POLICY "Admins have full access to lead notes"
  ON lead_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for users to manage notes for their leads
CREATE POLICY "Users can manage notes for their leads"
  ON lead_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_leads cl
      JOIN client_users cu ON cu.client_id = cl.client_id
      WHERE cl.id = lead_notes.lead_id
      AND cu.user_id = auth.uid()
    )
  );

CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);
