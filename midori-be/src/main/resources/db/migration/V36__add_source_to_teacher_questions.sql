-- Add source column to teacher_questions table
ALTER TABLE teacher_questions ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'HOMEWORK';
