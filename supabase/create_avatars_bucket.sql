
-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- Set policy to allow authenticated users to upload to their own folder
CREATE POLICY "Allow users to upload their own avatar" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = SUBSTRING(name, 1, POSITION('/' in name) - 1));

-- Set policy to allow authenticated users to update their own avatar
CREATE POLICY "Allow users to update their own avatar" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (auth.uid())::text = SUBSTRING(name, 1, POSITION('/' in name) - 1));

-- Set policy to allow authenticated users to read all avatars
CREATE POLICY "Allow public to read all avatars" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');
