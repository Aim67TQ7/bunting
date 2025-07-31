-- Step 1: Remove unnecessary columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS call_name;

-- Step 2: Ensure encryption_salt column exists and is properly configured
-- (It already exists, but let's make sure it's set up correctly)
ALTER TABLE public.profiles 
ALTER COLUMN encryption_salt TYPE text;

-- Step 3: Update the user creation trigger to generate encryption salt
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, encryption_salt)
  VALUES (
    new.id,
    encode(gen_random_bytes(32), 'base64')  -- Generate a random 32-byte salt, base64 encoded
  );
  RETURN new;
END;
$function$;

-- Step 4: Backfill encryption salts for existing users who don't have them
UPDATE public.profiles 
SET encryption_salt = encode(gen_random_bytes(32), 'base64')
WHERE encryption_salt IS NULL OR encryption_salt = '';

-- Step 5: Create index on user_id in Employee_id table for better performance
CREATE INDEX IF NOT EXISTS idx_employee_id_user_id ON public."Employee_id"(user_id);

-- Step 6: Ensure proper foreign key constraint exists (if not already present)
-- Note: We can't directly reference auth.users, but we ensure the relationship through application logic