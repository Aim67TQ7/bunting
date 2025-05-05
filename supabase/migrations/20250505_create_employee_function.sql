
-- Create a stored procedure to get all available employees (those without user_id)
CREATE OR REPLACE FUNCTION public.get_available_employees()
RETURNS TABLE (
  employee_id uuid,
  displayName text,
  userPrincipalName text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.employee_id,
    e.displayName,
    e.userPrincipalName
  FROM "Employee_id" e
  WHERE e.user_id IS NULL
  ORDER BY e.displayName;
END;
$$;
