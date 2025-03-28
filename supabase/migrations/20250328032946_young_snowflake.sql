/*
  # Migrate from client_customers to client_leads

  1. Changes
    - Drop client_customers table and its related objects
    - Data is already being handled by client_leads table
  
  2. Security
    - Existing RLS policies on client_leads table remain unchanged
*/

-- Drop the client_customers table and all its dependencies
DROP TABLE IF EXISTS client_customers CASCADE;