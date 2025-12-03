-- Add badge_number column to emps table
ALTER TABLE public.emps ADD COLUMN IF NOT EXISTS badge_number text;

-- Migrate all auth users to emps table (insert only if not already exists)
INSERT INTO public.emps (user_id, display_name)
SELECT 
  au.id as user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as display_name
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.emps e WHERE e.user_id = au.id
)
ON CONFLICT DO NOTHING;