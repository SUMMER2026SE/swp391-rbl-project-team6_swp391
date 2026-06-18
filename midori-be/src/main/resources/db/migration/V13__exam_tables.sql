-- Exam tables for random exam generation feature
-- V13__exam_tables.sql

-- Classes table (if not exists)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(10) NOT NULL,
    max_students INT NOT NULL,
    teacher_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    level VARCHAR(10) NOT NULL,
    total_questions INT NOT NULL,
    time_limit INT NOT NULL,
    exam_mode VARCHAR(20) NOT NULL DEFAULT 'SAME_FOR_ALL',
    question_reuse VARCHAR(20) NOT NULL DEFAULT 'ALLOW_REUSE',
    randomize_answers BOOLEAN NOT NULL DEFAULT FALSE,
    lesson_ids TEXT,
    category VARCHAR(50),
    difficulty_easy INT DEFAULT 0,
    difficulty_medium INT DEFAULT 0,
    difficulty_hard INT DEFAULT 0,
    created_by UUID NOT NULL,
    assigned_class_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_class_id) REFERENCES classes(id)
);

-- Exam questions table
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY,
    exam_id UUID NOT NULL,
    source_grammar_id UUID,
    source_vocabulary_id UUID,
    question_text TEXT NOT NULL,
    correct_answer_index INT NOT NULL,
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'MEDIUM',
    lesson_id VARCHAR(50),
    category VARCHAR(50),
    display_order INT,
    points INT DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Exam question options table
CREATE TABLE exam_question_options (
    exam_question_id UUID NOT NULL,
    option_index INT NOT NULL,
    option_text TEXT,
    PRIMARY KEY (exam_question_id, option_index),
    FOREIGN KEY (exam_question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);

-- Student exams table (tracks each student's exam instance)
CREATE TABLE student_exams (
    id UUID PRIMARY KEY,
    exam_id UUID NOT NULL,
    student_id UUID NOT NULL,
    exam_version VARCHAR(20) NOT NULL,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    score INT,
    total_points INT,
    percentage DOUBLE PRECISION,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE KEY unique_exam_student (exam_id, student_id)
);

-- Student exam questions table (individual questions for each student)
CREATE TABLE student_exam_questions (
    id UUID PRIMARY KEY,
    student_exam_id UUID NOT NULL,
    original_question_id UUID,
    question_text TEXT NOT NULL,
    correct_answer_index INT NOT NULL,
    display_order INT,
    points INT,
    selected_answer_index INT,
    is_correct BOOLEAN,
    FOREIGN KEY (student_exam_id) REFERENCES student_exams(id) ON DELETE CASCADE
);

-- Student exam question options table
CREATE TABLE student_exam_question_options (
    student_exam_question_id UUID NOT NULL,
    option_index INT NOT NULL,
    option_text TEXT,
    PRIMARY KEY (student_exam_question_id, option_index),
    FOREIGN KEY (student_exam_question_id) REFERENCES student_exam_questions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_level ON exams(level);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_student_exams_exam_id ON student_exams(exam_id);
CREATE INDEX idx_student_exams_student_id ON student_exams(student_id);
CREATE INDEX idx_student_exam_questions_student_exam_id ON student_exam_questions(student_exam_id);
