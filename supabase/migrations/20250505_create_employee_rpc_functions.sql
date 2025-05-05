
-- Function to get employee data by user_id
CREATE OR REPLACE FUNCTION public.get_employee_by_user_id(user_id_param UUID)
RETURNS TABLE (
  employee_id UUID,
  user_id UUID,
  displayName TEXT,
  userPrincipalName TEXT,
  department TEXT,
  jobTitle TEXT,
  officeLocation TEXT,
  city TEXT,
  state TEXT,
  country TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.employee_id,
    e.user_id,
    e.displayName,
    e.userPrincipalName,
    e.department,
    e.jobTitle,
    e.officeLocation,
    e.city,
    e.state,
    e.country
  FROM "Employee_id" e
  WHERE e.user_id = user_id_param;
END;
$$;

-- Function to update employee data
CREATE OR REPLACE FUNCTION public.update_employee_data(
  user_id_param UUID,
  department_param TEXT,
  jobtitle_param TEXT,
  officelocation_param TEXT,
  city_param TEXT,
  state_param TEXT,
  country_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "Employee_id"
  SET 
    department = department_param,
    jobTitle = jobtitle_param,
    officeLocation = officelocation_param,
    city = city_param,
    state = state_param,
    country = country_param
  WHERE user_id = user_id_param;
END;
$$;
