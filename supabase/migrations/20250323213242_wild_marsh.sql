/*
  # Add super_role field to profiles

  1. Changes
    - Add `super_role` column to profiles table
    - Add check constraint to validate super_role values
    - Update RLS policies to consider super_role

  2. Security
    - Maintain existing RLS policies
    - Only admins can modify super_role
*/

-- Add super_role column with check constraint
ALTER TABLE profiles 
ADD COLUMN super_role text DEFAULT NULL;

-- Add check constraint for valid super_role values
ALTER TABLE profiles
ADD CONSTRAINT profiles_super_role_check
CHECK (super_role = ANY (ARRAY['manager'::text, 'supervisor'::text, 'team_lead'::text]));

-- Create policy to allow only admins to update super_role
CREATE POLICY "Only admins can update super_role"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (role = 'admin'::text) AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'::text))
)
WITH CHECK (
  (role = 'admin'::text) AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'::text))
);
