-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view all employees" ON public.emps;

-- Create a PERMISSIVE SELECT policy instead
CREATE POLICY "Users can view all employees" 
ON public.emps 
FOR SELECT 
TO authenticated
USING (true);

-- Also fix INSERT and UPDATE to be permissive
DROP POLICY IF EXISTS "Users can insert own record" ON public.emps;
DROP POLICY IF EXISTS "Users can update own record" ON public.emps;

CREATE POLICY "Users can insert own record" 
ON public.emps 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own record" 
ON public.emps 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);