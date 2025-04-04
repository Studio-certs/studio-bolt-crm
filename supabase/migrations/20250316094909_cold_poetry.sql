/*
  # Initial Schema Setup

  1. Tables
    - profiles: User profiles with role management
    - clients: Client information
    - client_users: User-client assignments
    - client_notes: Client-related notes
    - client_meetings: Client meetings
    - client_leads: Sales leads
    - lead_chatter: Lead-related communication

  2. Security
    - RLS enabled on all tables
    - Policies for authenticated access
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS lead_chatter CASCADE;
DROP TABLE IF EXISTS client_leads CASCADE;
DROP TABLE IF EXISTS client_meetings CASCADE;
DROP TABLE IF EXISTS client_notes CASCADE;
DROP TABLE IF EXISTS client_users CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'user',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['admin'::text, 'user'::text]))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clients_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]))
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create client_users table
CREATE TABLE client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, user_id),
  CONSTRAINT client_users_role_check CHECK (role = ANY (ARRAY['member'::text]))
);

ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to client_users"
  ON client_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own assignments"
  ON client_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add policy for users to view assigned clients (after client_users table exists)
CREATE POLICY "Users can view assigned clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = clients.id
      AND client_users.user_id = auth.uid()
    )
  );

-- Create client_notes table
CREATE TABLE client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  CONSTRAINT client_notes_content_length CHECK (char_length(content) > 0)
);

ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage notes for assigned clients"
  ON client_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = client_notes.client_id
      AND client_users.user_id = auth.uid()
    )
  );

-- Create client_meetings table
CREATE TABLE client_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  date timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  CONSTRAINT client_meetings_status_check CHECK (
    status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text])
  )
);

ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage meetings for assigned clients"
  ON client_meetings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = client_meetings.client_id
      AND client_users.user_id = auth.uid()
    )
  );

-- Create client_leads table
CREATE TABLE client_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'new',
  value numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT client_leads_source_check CHECK (
    source = ANY (ARRAY['referral'::text, 'website'::text, 'cold_call'::text, 'other'::text])
  ),
  CONSTRAINT client_leads_status_check CHECK (
    status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'won'::text, 'lost'::text])
  )
);

ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads for assigned clients"
  ON client_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = client_leads.client_id
      AND client_users.user_id = auth.uid()
    )
  );

-- Create lead_chatter table
CREATE TABLE lead_chatter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES client_leads(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id)
);

ALTER TABLE lead_chatter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chatter for assigned clients' leads"
  ON lead_chatter
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      JOIN client_leads cl ON cl.client_id = cu.client_id
      WHERE cl.id = lead_chatter.lead_id
      AND cu.user_id = auth.uid()
    )
  );

-- Create helpful indexes
CREATE INDEX idx_client_users_lookup ON client_users(client_id, user_id);
CREATE INDEX idx_client_notes_client ON client_notes(client_id);
CREATE INDEX idx_client_meetings_client ON client_meetings(client_id);
CREATE INDEX idx_client_leads_client ON client_leads(client_id);
CREATE INDEX idx_lead_chatter_lead ON lead_chatter(lead_id);
