-- ============================================================
-- V12__listening_exercise_type.sql
-- Adds exercise_type for Listening lessons
-- ============================================================

ALTER TABLE listening_lessons
    ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(50);

UPDATE listening_lessons
SET exercise_type = 'Dictation'
WHERE exercise_type IS NULL;

ALTER TABLE listening_lessons
    ALTER COLUMN exercise_type SET NOT NULL;

COMMENT ON COLUMN listening_lessons.exercise_type IS 'Exercise type: Dictation, Blank Fill, Multiple Choice';

CREATE INDEX IF NOT EXISTS idx_listening_lessons_exercise_type
ON listening_lessons(exercise_type);
