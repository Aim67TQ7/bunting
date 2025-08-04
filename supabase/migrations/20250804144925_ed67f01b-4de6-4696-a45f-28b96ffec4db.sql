-- Add demo user support and app visibility control

-- Add demo visibility column to app_items table
ALTER TABLE public.app_items 
ADD COLUMN show_to_demo boolean NOT NULL DEFAULT true;

-- Add demo user flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_demo_user boolean NOT NULL DEFAULT false;

-- Create function to identify demo users
CREATE OR REPLACE FUNCTION public.is_demo_user(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT user_email = 'demo@buntinggpt.com';
$$;

-- Update profiles RLS to allow demo user identification
CREATE POLICY "Demo users can view their profile" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id OR is_demo_user((auth.jwt() ->> 'email')));

-- Update app_items RLS to respect demo visibility
DROP POLICY IF EXISTS "Anyone can view active app items" ON public.app_items;

CREATE POLICY "Users can view appropriate app items" ON public.app_items
    FOR SELECT
    USING (
        is_active = true 
        AND (
            NOT is_demo_user((auth.jwt() ->> 'email')) 
            OR show_to_demo = true
        )
    );