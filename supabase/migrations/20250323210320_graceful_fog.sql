/*
  # Add deadline to todos

  1. Changes
    - Add deadline column to lead_todos table
    - Add deadline_reminder column to lead_todos table
  
  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE lead_todos
ADD COLUMN deadline timestamptz,
ADD COLUMN deadline_reminder boolean DEFAULT false;
