-- ============================================================
-- V39__alter_student_saved_words_unique_constraint.sql
-- Alter unique constraint on student_saved_words to support per-lesson/video saves
-- ============================================================

ALTER TABLE student_saved_words DROP CONSTRAINT IF EXISTS uk_saved_word_user_surface;

-- Drop and recreate unique constraint with lesson_id (nullable)
ALTER TABLE student_saved_words ADD CONSTRAINT uk_saved_word_user_surface_lesson UNIQUE (user_id, surface, lesson_id);
