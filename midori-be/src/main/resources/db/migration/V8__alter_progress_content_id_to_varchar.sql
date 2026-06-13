-- ============================================================
-- Alter progress content_id from UUID to VARCHAR(500)
-- Needed because vocabulary word-level contentId uses format:
--   lessonId::word  (e.g., "123e4567-...::食べる")
-- ============================================================

ALTER TABLE user_learning_progress
ALTER COLUMN content_id TYPE VARCHAR(500);

-- Unique constraint (user_id, content_type, content_id) still works with VARCHAR
