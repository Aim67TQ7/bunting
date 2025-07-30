-- Create app_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_type AS ENUM ('application', 'calculator', 'sales_tool', 'report');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the unified app_items table
CREATE TABLE public.app_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  url text NOT NULL,
  icon_path text,
  video_url text,
  is_active boolean DEFAULT true,
  coming_soon boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Category to distinguish between types
  category app_type NOT NULL,
  
  -- Application-specific fields
  requires_auth boolean DEFAULT false,
  license text DEFAULT '111-111',
  iframe_height text DEFAULT '800px',
  auth_passcode text,
  is_new boolean DEFAULT false,
  use_count integer DEFAULT 0,
  auth_type text DEFAULT 'none',
  view_count integer DEFAULT 0,
  
  -- Sales tools specific field
  token text,
  
  -- Reports specific field
  access_token text
);

-- Enable RLS
ALTER TABLE public.app_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow anonymous users to view active app items"
ON public.app_items FOR SELECT
USING (auth.role() = 'anon' AND is_active = true);

CREATE POLICY "Allow authenticated users to view active app items"
ON public.app_items FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Everyone can view active app items"
ON public.app_items FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users with admin role can insert app items"
ON public.app_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.uid() = users.id 
  AND (users.raw_user_meta_data ->> 'role') = 'admin'
));

CREATE POLICY "Authenticated users with admin role can update app items"
ON public.app_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.uid() = users.id 
  AND (users.raw_user_meta_data ->> 'role') = 'admin'
));

CREATE POLICY "Authenticated users with admin role can delete app items"
ON public.app_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.uid() = users.id 
  AND (users.raw_user_meta_data ->> 'role') = 'admin'
));

-- Migrate data from applications table
INSERT INTO public.app_items (
  id, name, description, url, icon_path, video_url, is_active, coming_soon, 
  created_at, updated_at, category, requires_auth, license, iframe_height, 
  auth_passcode, is_new, use_count, auth_type, view_count
)
SELECT 
  id, name, COALESCE(description, '') as description, url, icon_path, video_url, is_active, coming_soon,
  created_at, updated_at, 'application'::app_type, requires_auth, license, 
  iframe_height, auth_passcode, is_new, use_count, auth_type, view_count
FROM public.applications;

-- Migrate data from calculators table
INSERT INTO public.app_items (
  id, name, description, url, icon_path, video_url, is_active, coming_soon, 
  created_at, updated_at, category
)
SELECT 
  id, name, description, url, icon_path, video_url, is_active, false,
  created_at, updated_at, 'calculator'::app_type
FROM public.calculators;

-- Migrate data from sales_tools table
INSERT INTO public.app_items (
  id, name, description, url, icon_path, video_url, is_active, coming_soon, 
  created_at, updated_at, category, token
)
SELECT 
  id, name, description, url, icon_path, video_url, is_active, coming_soon,
  created_at, updated_at, 'sales_tool'::app_type, token
FROM public.sales_tools;

-- Migrate data from reports table
INSERT INTO public.app_items (
  id, name, description, url, icon_path, video_url, is_active, coming_soon, 
  created_at, updated_at, category, access_token
)
SELECT 
  id, name, description, url, icon_path, video_url, is_active, coming_soon,
  created_at, updated_at, 'report'::app_type, access_token
FROM public.reports;

-- Create trigger for updated_at
CREATE TRIGGER update_app_items_updated_at
  BEFORE UPDATE ON public.app_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();

-- Update the logging function to work with app_items
CREATE OR REPLACE FUNCTION public.log_app_item_usage(app_id uuid, action text, session_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_log_id uuid;
BEGIN
  INSERT INTO public.app_usage_logs (application_id, user_id, action, session_id)
  VALUES (app_id, auth.uid(), action, COALESCE(session_id, gen_random_uuid()))
  RETURNING id INTO new_log_id;
  
  IF action = 'view' THEN
    UPDATE public.app_items SET view_count = view_count + 1 WHERE id = app_id;
  ELSIF action = 'use' THEN
    UPDATE public.app_items SET use_count = use_count + 1 WHERE id = app_id;
  END IF;
  
  RETURN new_log_id;
END;
$$;