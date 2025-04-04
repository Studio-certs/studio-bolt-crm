/*
  # Add Generated Description Columns to client_customers

  1. Changes
    - Add generated_description column as JSONB type
    - Add generated_description_status as ENUM type
    - Add check constraint for valid status values
  
  2. Security
    - Maintains existing RLS policies
*/

-- Create enum type for generated description status
DO $$ BEGIN
    CREATE TYPE generated_description_status_type AS ENUM (
        'not_generated',
        'processing',
        'failed',
        'generated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns
ALTER TABLE client_customers
ADD COLUMN generated_description JSONB,
ADD COLUMN generated_description_status generated_description_status_type NOT NULL DEFAULT 'not_generated';

-- Add comment to explain the columns
COMMENT ON COLUMN client_customers.generated_description IS 'Stores JSON data for generated descriptions';
COMMENT ON COLUMN client_customers.generated_description_status IS 'Status of the generated description: not_generated, processing, failed, or generated';
