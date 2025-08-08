-- Create table for user favorites of app items
CREATE TABLE IF NOT EXISTS public.user_favorite_app_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_item_id uuid NOT NULL REFERENCES public.app_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_favorite_app_items_user_app_unique UNIQUE (user_id, app_item_id)
);

-- Index to speed up lookups
CREATE INDEX IF NOT EXISTS idx_user_favorite_app_items_user ON public.user_favorite_app_items(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_favorite_app_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their favorites" ON public.user_favorite_app_items;
CREATE POLICY "Users can view their favorites"
ON public.user_favorite_app_items
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their favorites" ON public.user_favorite_app_items;
CREATE POLICY "Users can add their favorites"
ON public.user_favorite_app_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their favorites" ON public.user_favorite_app_items;
CREATE POLICY "Users can remove their favorites"
ON public.user_favorite_app_items
FOR DELETE
USING (auth.uid() = user_id);

-- Limit: max 3 favorites per user
CREATE OR REPLACE FUNCTION public.enforce_favorite_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_favorite_app_items WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'FAVORITE_LIMIT_EXCEEDED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_favorite_limit ON public.user_favorite_app_items;
CREATE TRIGGER trg_enforce_favorite_limit
BEFORE INSERT ON public.user_favorite_app_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_favorite_limit();
