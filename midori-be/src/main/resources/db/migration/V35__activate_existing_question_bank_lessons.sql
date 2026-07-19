-- V29: Update existing Question Bank lessons from DRAFT to ACTIVE status
-- This migration ensures all existing lessons are visible in the Homework/Exam Generator
-- The default status was changed from DRAFT to ACTIVE in the entity, but existing records
-- still have DRAFT status and would not appear in the generator without this migration

UPDATE question_bank_lessons
SET status = 'ACTIVE'
WHERE status = 'DRAFT';
