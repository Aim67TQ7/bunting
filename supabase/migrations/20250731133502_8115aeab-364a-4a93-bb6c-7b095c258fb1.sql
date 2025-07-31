-- Add encryption_salt column to profiles table for storing user-specific encryption salts
ALTER TABLE public.profiles 
ADD COLUMN encryption_salt TEXT;