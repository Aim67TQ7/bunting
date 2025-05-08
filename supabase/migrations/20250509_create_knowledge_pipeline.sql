
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create system user ID for storing training data
DO $$
BEGIN
  -- Check if the auth.users entry exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    -- Insert system user only if it doesn't exist
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000000', 'system@buntinggpt.internal');
    
    -- Create profile for system user
    INSERT INTO public.profiles (id, first_name)
    VALUES ('00000000-0000-0000-0000-000000000000', 'System');
  END IF;
END $$;

-- Create a weekly summary job
SELECT cron.schedule(
  'weekly-conversation-summary',
  '0 0 * * 0', -- At midnight on Sunday
  $$
  SELECT net.http_post(
    url := 'https://qzwxisdfwswsrbzvpzlo.supabase.co/functions/v1/summarize-conversations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || (SELECT secret FROM vault.secrets WHERE name = 'service_role_key' LIMIT 1) || '"}'::jsonb,
    body := '{"days": 7}'::jsonb
  );
  $$
);
