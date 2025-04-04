/*
  # Add Todo Notes Table

  1. New Tables
    - `lead_todo_notes`: Stores notes related to specific todo items
      - `id` (uuid, primary key)
      - `todo_id` (uuid, references lead_todos)
      - `content` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)

  2. Security
    - Enable RLS
    - Add policy for users to manage notes for todos they have access to
    - Add index for faster lookups
*/

-- Create the lead_todo_notes table
CREATE TABLE IF NOT EXISTS lead_todo_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id uuid REFERENCES lead_todos(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE lead_todo_notes ENABLE ROW LEVEL SECURITY;

-- Add policy for users to manage notes for accessible todos
CREATE POLICY "Users can manage notes for their accessible todos"
  ON lead_todo_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM lead_todos lt
      WHERE lt.id = lead_todo_notes.todo_id
      AND (
        -- User created the todo OR
        lt.created_by = auth.uid()
        OR
        -- User is assigned to the client of the lead the todo belongs to
        EXISTS (
          SELECT 1
          FROM client_leads cl
          JOIN client_users cu ON cu.client_id = cl.client_id
          WHERE cl.id = lt.lead_id
          AND cu.user_id = auth.uid()
        )
      )
    )
  );

-- Add index for faster lookup by todo_id
CREATE INDEX IF NOT EXISTS idx_lead_todo_notes_todo ON lead_todo_notes(todo_id);