/*
  # Fix Storage Permissions

  1. Changes
    - Create document-manager storage bucket if not exists
    - Set up proper storage policies for authenticated users
    - Enable public access to the bucket
  
  2. Security
    - Authenticated users can upload files
    - Authenticated users can manage their own files
    - Public read access for downloads
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-manager', 'document-manager', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete their own files" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable upload for authenticated users
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'document-manager');

-- Enable update for file owners
CREATE POLICY "Authenticated users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'document-manager' AND owner = auth.uid())
WITH CHECK (bucket_id = 'document-manager' AND owner = auth.uid());

-- Enable public read access
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'document-manager');

-- Enable delete for file owners
CREATE POLICY "Authenticated users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'document-manager' AND owner = auth.uid());