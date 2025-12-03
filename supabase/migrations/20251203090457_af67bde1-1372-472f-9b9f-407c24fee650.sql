-- Create a security definer function for safely upserting emps records
CREATE OR REPLACE FUNCTION public.upsert_emp_record(
  p_user_id uuid,
  p_display_name text,
  p_location text,
  p_job_level text DEFAULT 'Employee',
  p_department text DEFAULT NULL,
  p_manager_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_record_id uuid;
BEGIN
  -- Only allow users to upsert their own record
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  INSERT INTO public.emps (user_id, display_name, location, job_level, department, manager_id)
  VALUES (p_user_id, p_display_name, p_location::employee_location, p_job_level::job_level, p_department, p_manager_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    location = EXCLUDED.location,
    job_level = EXCLUDED.job_level,
    department = EXCLUDED.department,
    manager_id = EXCLUDED.manager_id,
    updated_at = now()
  RETURNING id INTO v_record_id;
  
  RETURN v_record_id;
END;
$$;