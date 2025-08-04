-- Fix RLS policies for avatars bucket to allow user uploads in their own folder

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create new policies with correct folder structure matching
CREATE POLICY "Users can upload avatars to their own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' 
        AND (auth.uid())::text = (string_to_array(name, '/'))[1]
    );

CREATE POLICY "Users can update avatars in their own folder" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars' 
        AND (auth.uid())::text = (string_to_array(name, '/'))[1]
    );

CREATE POLICY "Users can delete avatars in their own folder" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars' 
        AND (auth.uid())::text = (string_to_array(name, '/'))[1]
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');