-- Add badge authentication columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS badge_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS badge_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS badge_pin_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_pin_locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS badge_verification_code TEXT,
ADD COLUMN IF NOT EXISTS badge_verification_expires_at TIMESTAMPTZ;

-- Create index for fast badge lookups
CREATE INDEX IF NOT EXISTS idx_employees_badge_number 
ON public.employees(badge_number) WHERE badge_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.badge_number IS 'Employee badge number for badge-based authentication';
COMMENT ON COLUMN public.employees.badge_pin_hash IS 'Hashed PIN for badge authentication (never stored plain)';
COMMENT ON COLUMN public.employees.badge_pin_attempts IS 'Failed PIN attempts counter for rate limiting';
COMMENT ON COLUMN public.employees.badge_pin_locked_until IS 'Lockout timestamp after too many failed attempts';
COMMENT ON COLUMN public.employees.badge_verification_code IS 'Temporary OTP code hash for badge signup/reset';
COMMENT ON COLUMN public.employees.badge_verification_expires_at IS 'OTP expiration timestamp';