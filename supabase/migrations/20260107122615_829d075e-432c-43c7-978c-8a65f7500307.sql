-- Add badge_pin_is_default column to track if user still has default PIN
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS badge_pin_is_default BOOLEAN DEFAULT true;