
-- Add scope column to user_training_submissions table with default 'user'
-- This is non-breaking and maintains existing functionality
ALTER TABLE public.user_training_submissions 
ADD COLUMN IF NOT EXISTS scope public.training_data_scope DEFAULT 'user';

-- Create an index for better performance when querying by status
CREATE INDEX IF NOT EXISTS idx_user_training_submissions_status 
ON public.user_training_submissions(status);

-- Create an index for better performance when querying by user_id and status
CREATE INDEX IF NOT EXISTS idx_user_training_submissions_user_status 
ON public.user_training_submissions(user_id, status);
