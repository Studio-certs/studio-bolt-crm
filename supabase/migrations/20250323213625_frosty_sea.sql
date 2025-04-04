/*
  # Add superadmin to super_role options

  1. Changes
    - Drop existing check constraint
    - Add updated check constraint with superadmin option
*/

-- Drop existing constraint
ALTER TABLE profiles
DROP CONSTRAINT profiles_super_role_check;

-- Add updated constraint with superadmin
ALTER TABLE profiles
ADD CONSTRAINT profiles_super_role_check
CHECK (super_role = ANY (ARRAY['manager'::text, 'supervisor'::text, 'team_lead'::text, 'superadmin'::text]));
