/*
  # Disable RLS on lead_files table

  1. Changes
    - Disable RLS on lead_files table
    - Drop existing policies as they won't be needed
  
  2. Security
    - Table will no longer use RLS
    - All authenticated users will have full access
*/

-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins have full access to lead files" ON lead_files;
  DROP POLICY IF EXISTS "Users can manage files for their leads" ON lead_files;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Disable RLS on lead_files table
ALTER TABLE lead_files DISABLE ROW LEVEL SECURITY;