-- Homework tables
-- V18__classes_homework_questionbank.sql

CREATE TABLE IF NOT EXISTS homework (
    id UUID PRIMARY KEY,
    class_id UUID NOT NULL,
    lesson_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    due_date TIMESTAMP NOT NULL,
    max_score INT NOT NULL,
    attempts INT DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY,
    homework_id UUID NOT NULL,
    student_id UUID NOT NULL,
    submission_text TEXT,
    attachment_url VARCHAR(255),
    score INT,
    feedback TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by UUID,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (graded_by) REFERENCES users(id)
);

-- Teacher Question Bank tables
CREATE TABLE IF NOT EXISTS teacher_questions (
    id UUID PRIMARY KEY,
    teacher_id UUID NOT NULL,
    topic_id VARCHAR(100),
    prompt TEXT NOT NULL,
    jp_prompt VARCHAR(255),
    question_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    correct_answer_index INT NOT NULL,
    explanation TEXT,
    tags VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    points INT DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS teacher_question_options (
    question_id UUID NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    option_order INT NOT NULL,
    PRIMARY KEY (question_id, option_order),
    FOREIGN KEY (question_id) REFERENCES teacher_questions(id) ON DELETE CASCADE
);

-- Alter users table to add class_id reference
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id);

-- ClassStudent relationship table (if missing)
CREATE TABLE IF NOT EXISTS class_students (
    class_id UUID NOT NULL,
    student_id UUID NOT NULL,
    PRIMARY KEY (class_id, student_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ClassInvite relationship table (if missing)
CREATE TABLE IF NOT EXISTS class_invites (
    id UUID PRIMARY KEY,
    class_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Homework questions join table
CREATE TABLE IF NOT EXISTS homework_questions (
    homework_id UUID NOT NULL,
    question_id UUID NOT NULL,
    PRIMARY KEY (homework_id, question_id),
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES teacher_questions(id) ON DELETE CASCADE
);

-- Alter exam_questions to link to teacher_questions
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS source_teacher_question_id UUID REFERENCES teacher_questions(id);

