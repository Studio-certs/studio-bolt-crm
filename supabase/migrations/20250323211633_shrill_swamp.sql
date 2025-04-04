/*
  # Add Settings Table
  
  1. New Tables
    - `app_settings`: For storing application settings
      - `key` (text, primary key)
      - `value` (text)
      - `updated_at` (timestamp)
      - `updated_by` (uuid)
  
  2. Security
    - Enable RLS
    - Only admins can modify settings
    - Anyone can view settings
*/

CREATE TABLE app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Anyone can view settings"
  ON app_settings
  FOR SELECT
  TO public
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Only admins can modify settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('login_image', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2400');
