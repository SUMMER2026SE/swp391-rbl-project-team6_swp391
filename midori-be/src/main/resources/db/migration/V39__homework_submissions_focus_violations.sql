-- Add focus_violation_count column to homework_submissions
-- Tracks anti-cheat / window-blur / tab-switch violations detected during the student attempt.
-- The exact field name (`focus_violation_count`) is the canonical backend source of truth
-- for "Focus Violations" displayed in both the Student View Result and the Teacher
-- Homework "View Submission" page.
ALTER TABLE homework_submissions
    ADD COLUMN IF NOT EXISTS focus_violation_count INT NOT NULL DEFAULT 0;
