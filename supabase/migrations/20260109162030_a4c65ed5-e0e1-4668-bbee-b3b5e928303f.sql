-- Backfill missing emps records for existing users (no conflict handling needed - these are new inserts)
INSERT INTO public.emps (user_id, display_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'full_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.emps e WHERE e.user_id = u.id);

-- Backfill missing profiles records for existing users  
INSERT INTO public.profiles (id, first_name)
SELECT 
  u.id,
  COALESCE(
    SPLIT_PART(u.raw_user_meta_data ->> 'full_name', ' ', 1),
    SPLIT_PART(u.email, '@', 1)
  )
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Backfill missing user_preferences records for existing users
INSERT INTO public.user_preferences (user_id, theme, enabled_functions)
SELECT 
  u.id,
  'dark',
  ARRAY['magnetism_calculator', 'five_why', 'ai_assistant']::text[]
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_preferences up WHERE up.user_id = u.id);