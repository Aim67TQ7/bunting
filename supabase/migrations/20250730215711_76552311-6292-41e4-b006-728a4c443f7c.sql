-- Fix RLS policies for app_items table
DROP POLICY IF EXISTS "Anyone can view active app items" ON app_items;
DROP POLICY IF EXISTS "Authenticated users with admin role can manage app items" ON app_items;

-- Create correct RLS policies
CREATE POLICY "Anyone can view active app items" 
ON app_items FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage app items" 
ON app_items FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);