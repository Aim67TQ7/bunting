CREATE OR REPLACE FUNCTION public.get_employee_by_user_id(user_id_param uuid)
RETURNS TABLE(
  employee_id uuid, 
  user_id uuid, 
  displayname text, 
  userprincipalname text, 
  department text, 
  jobtitle text, 
  officelocation text, 
  city text, 
  state text, 
  country text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.user_id,
    CONCAT(e.name_first, ' ', e.name_last) as displayname,
    e.user_email as userprincipalname,
    e.department,
    e.job_title as jobtitle,
    e.location as officelocation,
    NULL::text as city,
    NULL::text as state,
    NULL::text as country
  FROM employees e
  WHERE e.user_id = user_id_param;
END;
$$;