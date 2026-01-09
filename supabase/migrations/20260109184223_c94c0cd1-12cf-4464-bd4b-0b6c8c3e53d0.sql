-- Fix RLS policies for authentication flow

-- 1. Add INSERT policy for profiles table (allows new users to have profile created)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 2. Add INSERT policy for user_preferences table (allows new users to have preferences created)
CREATE POLICY "Users can insert own preferences" 
ON public.user_preferences 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Enable RLS on emps table so existing policies are enforced
ALTER TABLE public.emps ENABLE ROW LEVEL SECURITY;