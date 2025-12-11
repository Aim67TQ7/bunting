-- Drop the problematic policy that only applies to public/anonymous role
DROP POLICY IF EXISTS "Users can view appropriate app items" ON public.app_items;

-- Create a proper SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view active app items" 
ON public.app_items 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Also allow demo users (anonymous) to see demo-appropriate items
CREATE POLICY "Anonymous users can view demo app items" 
ON public.app_items 
FOR SELECT 
TO anon
USING (is_active = true AND show_to_demo = true);