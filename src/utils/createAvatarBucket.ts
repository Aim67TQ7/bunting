
import { supabase } from "@/integrations/supabase/client";

export async function createAvatarBucket() {
  const sql = `
  -- Create avatars storage bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  SELECT 'avatars', 'avatars', true
  WHERE NOT EXISTS (
      SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  );

  -- Set policy to allow authenticated users to upload to their own folder
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to upload their own avatar'
    ) THEN
      EXECUTE 'CREATE POLICY "Allow users to upload their own avatar" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = ''avatars'' AND (auth.uid())::text = SUBSTRING(name, 1, POSITION(''/'' in name) - 1))';
    END IF;
  END
  $$;

  -- Set policy to allow authenticated users to update their own avatar
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to update their own avatar'
    ) THEN
      EXECUTE 'CREATE POLICY "Allow users to update their own avatar" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = ''avatars'' AND (auth.uid())::text = SUBSTRING(name, 1, POSITION(''/'' in name) - 1))';
    END IF;
  END
  $$;

  -- Set policy to allow authenticated users to read all avatars
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'Allow public to read all avatars'
    ) THEN
      EXECUTE 'CREATE POLICY "Allow public to read all avatars" ON storage.objects
        FOR SELECT
        USING (bucket_id = ''avatars'')';
    END IF;
  END
  $$;
  `;

  try {
    // You'll need service role permission to create buckets
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.error("Error creating avatar bucket:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error creating avatar bucket:", error);
    return false;
  }
}
