-- Create analytics table for tracking user activity
CREATE TABLE public.admin_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'page_view', 'app_open', 'conversation_start'
  event_data JSONB DEFAULT '{}'::jsonb,
  app_id UUID REFERENCES public.app_items(id) ON DELETE SET NULL,
  app_name TEXT,
  country TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins (by email) can read analytics
CREATE POLICY "Admins can view analytics"
ON public.admin_analytics
FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'rclausing@buntingmagnetics.com'
);

-- Anyone can insert their own analytics (for tracking)
CREATE POLICY "Users can insert own analytics"
ON public.admin_analytics
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Create index for faster queries
CREATE INDEX idx_admin_analytics_created_at ON public.admin_analytics(created_at DESC);
CREATE INDEX idx_admin_analytics_user_id ON public.admin_analytics(user_id);
CREATE INDEX idx_admin_analytics_event_type ON public.admin_analytics(event_type);
CREATE INDEX idx_admin_analytics_app_id ON public.admin_analytics(app_id);