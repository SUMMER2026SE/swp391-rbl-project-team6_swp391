-- V44__drop_legacy_tables.sql
-- ==============================================================================
-- Database Audit & Cleanup - Drop completely unused and legacy tables
--
-- Dependencies Checked:
-- - No active JPA Entities map to these tables.
-- - No active repositories, services, or controllers query them.
-- - No constraints or triggers depend on them.
-- ==============================================================================

DROP TABLE IF EXISTS student_reading_answer_options;
DROP TABLE IF EXISTS student_reading_answers;
DROP TABLE IF EXISTS student_reading_submissions;
DROP TABLE IF EXISTS grammar_practice_questions;
DROP TABLE IF EXISTS listening_questions;
DROP TABLE IF EXISTS jlpt_exams;
DROP TABLE IF EXISTS vocabulary_words;
