/*
      # Create Templates Table

      1. New Tables
        - `templates`: Stores reusable templates for various purposes.
          - `id` (uuid, primary key)
          - `name` (text, not null)
          - `type` (text, not null) - Categorizes the template (e.g., 'email', 'note')
          - `prompt` (text, not null) - The content or structure of the template
          - `created_by` (uuid, references profiles) - Admin who created the template
          - `created_at` (timestamptz)
          - `updated_at` (timestamptz)

      2. Security
        - Enable RLS on `templates` table.
        - Add policy for authenticated users to read all templates.
        - Add policy for admin users to perform all actions (create, read, update, delete).

      3. Indexes
        - Add index on `type` for potential filtering.
    */

    -- Create the templates table
    CREATE TABLE IF NOT EXISTS templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      type text NOT NULL,
      prompt text NOT NULL,
      created_by uuid REFERENCES profiles(id),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

    -- Policy: Authenticated users can read all templates
    CREATE POLICY "Allow authenticated read access to templates"
      ON templates
      FOR SELECT
      TO authenticated
      USING (true);

    -- Policy: Admins can perform all actions on templates
    CREATE POLICY "Allow admin full access to templates"
      ON templates
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );

    -- Add index on type column
    CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
