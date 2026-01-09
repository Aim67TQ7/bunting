-- Add sidebar_featured column to app_items for admin-promoted apps
ALTER TABLE public.app_items 
ADD COLUMN sidebar_featured boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.app_items.sidebar_featured IS 'When true, app appears in Featured section of sidebar for all users';