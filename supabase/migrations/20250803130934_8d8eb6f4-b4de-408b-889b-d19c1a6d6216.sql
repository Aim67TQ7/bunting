-- Add conversation preferences field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN conversation_preferences TEXT;