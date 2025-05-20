
-- Add new columns to the corrections table for topic, keywords and global flag
ALTER TABLE public.corrections 
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Create indexes for better performance when querying
CREATE INDEX IF NOT EXISTS corrections_topic_idx ON public.corrections(topic);
CREATE INDEX IF NOT EXISTS corrections_is_global_idx ON public.corrections(is_global);
CREATE INDEX IF NOT EXISTS corrections_user_id_idx ON public.corrections(user_id);
