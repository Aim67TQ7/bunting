-- Harden the favorite limit trigger function: remove SECURITY DEFINER and set a safe search_path
CREATE OR REPLACE FUNCTION public.enforce_favorite_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_favorite_app_items WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'FAVORITE_LIMIT_EXCEEDED';
  END IF;
  RETURN NEW;
END;
$$;