-- Add user guide progress tracking to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN user_guide_progress JSONB DEFAULT '{
  "has_seen_guide": false,
  "completed_sections": [],
  "guide_version": "1.0",
  "last_guide_interaction": null
}'::jsonb;