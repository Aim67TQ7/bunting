-- Drop existing restrictive policies for application_icons
DROP POLICY IF EXISTS "Authenticated users with admin role can upload application icon" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users with admin role can update application icon" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users with admin role can delete application icon" ON storage.objects;

-- Create new permissive policies for application_icons bucket
CREATE POLICY "Public read access for application_icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'application_icons');

CREATE POLICY "Authenticated users can upload to application_icons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'application_icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update application_icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'application_icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from application_icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'application_icons' AND auth.role() = 'authenticated');