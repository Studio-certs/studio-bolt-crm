/*
  # Add Storage for Image Uploads
  
  1. New Buckets
    - `images`: For storing uploaded images
  
  2. Security
    - Enable RLS on the bucket
    - Add policies for authenticated users to manage their own images
*/

-- Create a new bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true);

-- Enable RLS
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'images' AND owner = auth.uid());

CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND owner = auth.uid());