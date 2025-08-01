-- Fix avatar upload policies
-- First, let's check if avatars bucket exists and recreate policies with proper logic

-- Drop existing avatar policies that might be problematic
DROP POLICY IF EXISTS "Allow users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read all avatars" ON storage.objects;

-- Create comprehensive avatar policies
-- 1. Allow public read access to all avatars
CREATE POLICY "Public can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- 2. Allow authenticated users to upload their own avatar
-- The path should be: avatars/{user_id}/avatar.png
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 3. Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 4. Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);