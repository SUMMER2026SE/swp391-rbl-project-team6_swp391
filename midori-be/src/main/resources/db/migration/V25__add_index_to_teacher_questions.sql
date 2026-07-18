CREATE INDEX IF NOT EXISTS idx_teacher_questions_level_skill_status_diff
ON teacher_questions (level, skill, status, difficulty);
