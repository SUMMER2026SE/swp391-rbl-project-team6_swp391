-- ============================================================
-- V43__student_saved_words_learning_progress.sql
-- Add spaced repetition learning statistics to saved words
-- ============================================================

-- Add columns with safe defaults
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS learning_status VARCHAR(20) NOT NULL DEFAULT 'NEW';
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS is_difficult BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS correct_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS lapse_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE student_saved_words ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMP WITH TIME ZONE;

-- Create index for quick lookup of next review due words
CREATE INDEX IF NOT EXISTS idx_saved_words_next_review ON student_saved_words(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_saved_words_learning_status ON student_saved_words(user_id, learning_status);
