-- V52__exam_question_format_metadata.sql
-- Add question type and format metadata to exam_questions and student_exam_questions

ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50);
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS format_metadata TEXT;

ALTER TABLE student_exam_questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50);
ALTER TABLE student_exam_questions ADD COLUMN IF NOT EXISTS format_metadata TEXT;
ALTER TABLE student_exam_questions ADD COLUMN IF NOT EXISTS selected_answer_text TEXT;
ALTER TABLE student_exam_questions ADD COLUMN IF NOT EXISTS correct_answer_text TEXT;
