-- Create location and job_level enums for type safety
CREATE TYPE public.employee_location AS ENUM ('Newton', 'DuBois', 'Redditch', 'Berkhamsted', 'Home-Office');
CREATE TYPE public.job_level AS ENUM ('Executive', 'Manager', 'Supervisor', 'Lead', 'Employee');

-- Create the emps table (employee_id stored as uuid without FK constraint)
CREATE TABLE public.emps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_id uuid, -- Reference to Employee_id table (no FK due to missing unique constraint)
  location public.employee_location,
  job_level public.job_level,
  department text,
  manager_id uuid REFERENCES public.emps(id),
  display_name text,
  gdpr_consent_given boolean DEFAULT false,
  gdpr_consent_timestamp timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.emps ENABLE ROW LEVEL SECURITY;

-- Users can view all employees (needed for manager dropdown and org chart)
CREATE POLICY "Users can view all employees"
ON public.emps FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert their own record
CREATE POLICY "Users can insert own record"
ON public.emps FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
ON public.emps FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_emps_updated_at
BEFORE UPDATE ON public.emps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create emps record on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_emps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.emps (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger to create emps record on auth.users insert
CREATE TRIGGER on_auth_user_created_emps
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_emps();