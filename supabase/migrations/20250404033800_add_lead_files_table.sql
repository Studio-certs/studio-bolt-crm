/*
        # Add Lead Files Table

        1. New Tables
          - `lead_files`: Stores metadata for files uploaded for leads.
            - `id` (uuid, primary key)
            - `lead_id` (uuid, references client_leads)
            - `file_name` (text)
            - `file_path` (text, unique path in storage)
            - `file_size` (bigint)
            - `mime_type` (text)
            - `uploaded_at` (timestamp)
            - `uploaded_by` (uuid, references profiles)

        2. Security
          - Enable RLS on `lead_files` table.
          - Add policy for admins to have full access.
          - Add policy for users to manage files for leads they have access to.

        3. Indexes
          - Add index on `lead_id` for faster lookups.
      */

      -- Create the lead_files table
      CREATE TABLE IF NOT EXISTS lead_files (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid NOT NULL REFERENCES client_leads(id) ON DELETE CASCADE,
        file_name text NOT NULL,
        file_path text NOT NULL UNIQUE, -- Unique path/key in the IBM COS bucket
        file_size bigint NOT NULL,
        mime_type text,
        uploaded_at timestamptz DEFAULT now(),
        uploaded_by uuid DEFAULT auth.uid() REFERENCES profiles(id)
      );

      -- Enable Row Level Security
      ALTER TABLE lead_files ENABLE ROW LEVEL SECURITY;

      -- Add policy for admin access
      CREATE POLICY "Admins have full access to lead files"
        ON lead_files
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        );

      -- Add policy for users to manage files for accessible leads
      -- Users can view/upload/delete files if they created the lead OR are assigned to the client
      CREATE POLICY "Users can manage files for their accessible leads"
        ON lead_files
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM client_leads cl
            WHERE cl.id = lead_files.lead_id
            AND (
              -- User created the lead OR
              cl.created_by = auth.uid()
              OR
              -- User is assigned to the client of the lead
              EXISTS (
                SELECT 1
                FROM client_users cu
                WHERE cu.client_id = cl.client_id
                AND cu.user_id = auth.uid()
              )
            )
          )
        );

      -- Add index for faster lookup by lead_id
      CREATE INDEX IF NOT EXISTS idx_lead_files_lead ON lead_files(lead_id);
