-- Create the app_type enum
CREATE TYPE app_type AS ENUM ('application', 'calculator', 'sales_tool', 'report');

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
    category app_type NOT NULL,
    
    -- Fields from applications table
    requires_auth boolean DEFAULT false,
    license text DEFAULT '111-111',
    iframe_height text DEFAULT '800px',
    auth_passcode text,
    is_new boolean DEFAULT false,
    use_count integer DEFAULT 0,
    auth_type text DEFAULT 'none',
    view_count integer DEFAULT 0,
    
    -- Fields from sales_tools table
    token text,
    
    -- Fields from reports table
    access_token text
);

-- Enable RLS
ALTER TABLE public.app_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active app items" 
ON public.app_items 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users with admin role can manage app items" 
ON public.app_items 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = users.id 
    AND (users.raw_user_meta_data ->> 'role') = 'admin'
))
WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = users.id 
    AND (users.raw_user_meta_data ->> 'role') = 'admin'
));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_items_updated_at
    BEFORE UPDATE ON public.app_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate data from applications table
INSERT INTO public.app_items (
    id, name, description, url, icon_path, video_url, is_active, coming_soon,
    created_at, updated_at, category, requires_auth, license, iframe_height,
    auth_passcode, is_new, use_count, auth_type, view_count
)
SELECT 
    id, name, description, url, icon_path, video_url, is_active, coming_soon,
    created_at, updated_at, 'application'::app_type, requires_auth, license, 
    iframe_height, auth_passcode, is_new, use_count, auth_type, view_count
FROM public.applications;

-- Migrate data from calculators table
INSERT INTO public.app_items (
    id, name, description, url, icon_path, video_url, is_active, created_at, updated_at, category
)
SELECT 
    id, name, description, url, icon_path, video_url, is_active, created_at, updated_at, 'calculator'::app_type
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