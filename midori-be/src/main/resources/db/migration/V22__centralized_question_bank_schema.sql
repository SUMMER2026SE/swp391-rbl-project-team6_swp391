-- Create question_bank_lessons table
CREATE TABLE IF NOT EXISTS question_bank_lessons (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL,
    lesson_number INT NOT NULL,
    lesson_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial lessons for N5, N4, N3, N2, N1
INSERT INTO question_bank_lessons (level, lesson_number, lesson_name) VALUES
('N5', 1, 'Introduction to Japanese'),
('N5', 2, 'Basic Greetings'),
('N5', 3, 'Numbers and Counting'),
('N5', 4, 'Colors and Shapes'),
('N5', 5, 'Days and Months'),
('N4', 1, 'Daily Conversations'),
('N4', 2, 'Travel Japanese'),
('N4', 3, 'Shopping and Dining'),
('N3', 1, 'Workplace Japanese'),
('N3', 2, 'Expressing Opinions'),
('N3', 3, 'Making Requests'),
('N2', 1, 'Business Japanese'),
('N2', 2, 'Formal Correspondence'),
('N2', 3, 'News and Media'),
('N1', 1, 'Academic Discussions'),
('N1', 2, 'Literature and Culture'),
('N1', 3, 'Advanced Debate');

-- Alter teacher_questions table to add optional columns
ALTER TABLE teacher_questions ADD COLUMN IF NOT EXISTS level VARCHAR(10);
ALTER TABLE teacher_questions ADD COLUMN IF NOT EXISTS lesson_id INT REFERENCES question_bank_lessons(id) ON DELETE SET NULL;
ALTER TABLE teacher_questions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE teacher_questions ADD COLUMN IF NOT EXISTS audio_file_name VARCHAR(255);
ALTER TABLE teacher_questions ADD COLUMN IF NOT EXISTS audio_duration INT;
