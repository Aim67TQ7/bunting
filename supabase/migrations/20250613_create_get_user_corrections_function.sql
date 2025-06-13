
-- Create a function to get user corrections in a more reliable way
CREATE OR REPLACE FUNCTION get_user_corrections(
  p_user_id UUID,
  p_conversation_id UUID DEFAULT NULL,
  p_keywords TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  message_id TEXT,
  conversation_id UUID,
  user_id UUID,
  correction_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  topic TEXT,
  keywords TEXT[],
  is_global BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.message_id,
    c.conversation_id,
    c.user_id,
    c.correction_text,
    c.created_at,
    c.topic,
    c.keywords,
    c.is_global
  FROM corrections c
  WHERE 
    -- Get corrections for this specific conversation
    (p_conversation_id IS NOT NULL AND c.conversation_id = p_conversation_id)
    OR 
    -- Get global corrections from this user
    (c.user_id = p_user_id AND c.is_global = true)
    OR
    -- Get corrections with matching keywords if provided
    (p_keywords IS NOT NULL AND p_keywords && c.keywords)
  ORDER BY 
    -- Prioritize conversation-specific corrections
    CASE WHEN c.conversation_id = p_conversation_id THEN 1 
         WHEN c.is_global = true THEN 2 
         ELSE 3 END,
    c.created_at DESC
  LIMIT 20;
END;
$$;
