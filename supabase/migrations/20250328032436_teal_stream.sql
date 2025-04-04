/*
  # Add unique email constraint for client customers

  1. Changes
    - Add unique constraint on client_id and email combination
    - This ensures each client can't have multiple customers with the same email
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add unique constraint for email per client
ALTER TABLE client_customers
ADD CONSTRAINT unique_client_customer_email UNIQUE (client_id, email);
