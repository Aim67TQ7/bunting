-- =============================================
-- CRITICAL SECURITY FIXES - Phase 1: Database Security
-- =============================================

-- 1. Create proper admin role system (replacing raw_user_meta_data dependency)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'knowledge_manager', 'user')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_user_role(user_id_param UUID, role_param TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role = role_param 
    AND is_active = true
  );
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles"
  ON public.user_roles FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

-- 2. Add RLS policies for tables that currently have RLS enabled but no policies

-- calculators table
CREATE POLICY "Everyone can view active calculators"
  ON public.calculators FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage calculators"
  ON public.calculators FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

-- reports table  
CREATE POLICY "Everyone can view active reports"
  ON public.reports FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage reports"
  ON public.reports FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

-- Enable RLS on tables that don't have it but should
ALTER TABLE public.calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulltest_entities ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for system/reference tables
CREATE POLICY "Authenticated users can view embeddings"
  ON public.embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view entities"
  ON public.entities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view customer data"
  ON public.customer FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view product knowledge"
  ON public.product_knowledge_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- PT (Pull Test) related tables - admin only
CREATE POLICY "Admins can manage pt_entities"
  ON public.pt_entities FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pt_locations"
  ON public.pt_locations FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pt_test_results"
  ON public.pt_test_results FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pulltest_entities"
  ON public.pulltest_entities FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

-- 3. Update existing admin policies to use new role system instead of raw_user_meta_data

-- Update applications table policies
DROP POLICY IF EXISTS "Authenticated users with admin role can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Authenticated users with admin role can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Authenticated users with admin role can update applications" ON public.applications;

CREATE POLICY "Admins can delete applications"
  ON public.applications FOR DELETE
  USING (public.has_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (public.has_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE
  USING (public.has_user_role(auth.uid(), 'admin'));

-- Update approved_knowledge_managers table policy
DROP POLICY IF EXISTS "Admins can manage approved knowledge managers" ON public.approved_knowledge_managers;

CREATE POLICY "Admins can manage approved knowledge managers"
  ON public.approved_knowledge_managers FOR ALL
  USING (public.has_user_role(auth.uid(), 'admin'));

-- 4. Add audit logging for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (public.has_user_role(auth.uid(), 'admin'));

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type TEXT,
  table_name TEXT,
  record_id TEXT DEFAULT NULL,
  old_values JSONB DEFAULT NULL,
  new_values JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO public.admin_audit_log (admin_user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), action_type, table_name, record_id, old_values, new_values);
$$;

-- 5. Create function to safely assign admin roles (only existing admins can create new admins)
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  role_to_assign TEXT
) RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT public.has_user_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to assign roles';
  END IF;
  
  -- Validate role
  IF role_to_assign NOT IN ('admin', 'knowledge_manager', 'user') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, role_to_assign, auth.uid())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = true,
    assigned_at = now(),
    assigned_by = auth.uid();
    
  -- Log the action
  PERFORM public.log_admin_action(
    'ROLE_ASSIGNED',
    'user_roles',
    target_user_id::TEXT,
    NULL,
    jsonb_build_object('role', role_to_assign, 'assigned_by', auth.uid())
  );
  
  RETURN true;
END;
$$;