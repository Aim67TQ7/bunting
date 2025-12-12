-- Create temp_password_logs table for audit trail
CREATE TABLE public.temp_password_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_email TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.temp_password_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can view logs
CREATE POLICY "Admin can view password logs"
ON public.temp_password_logs
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM auth.users WHERE email = 'rclausing@buntingmagnetics.com'
));

-- Only admin can insert logs (via edge function with service role)
CREATE POLICY "Service role can insert password logs"
ON public.temp_password_logs
FOR INSERT
WITH CHECK (true);