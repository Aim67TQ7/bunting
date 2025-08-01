-- Fix avatar upload policies with simpler approach
-- Drop existing avatar policies that might be problematic
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create simpler and more direct avatar policies
-- Allow users to upload their own avatar (using folder-based security)
CREATE POLICY "Enable avatar uploads for authenticated users" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND starts_with(name, concat(auth.uid()::text, '/'))
);

-- Allow users to update their own avatar
CREATE POLICY "Enable avatar updates for authenticated users" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND starts_with(name, concat(auth.uid()::text, '/'))
);

-- Allow users to delete their own avatar
CREATE POLICY "Enable avatar deletes for authenticated users" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND starts_with(name, concat(auth.uid()::text, '/'))
);