-- ============================================================
-- V19__reading_questions.sql
-- BE-READ-02 - Reading Question Backend Foundation
-- PostgreSQL / Supabase
-- ============================================================

-- ============================================================
-- Reading Questions
-- ============================================================

CREATE TABLE reading_questions (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_lesson_id       UUID                NOT NULL,
    question_order          INTEGER             NOT NULL,
    question                TEXT                NOT NULL,
    option_a                TEXT                NOT NULL,
    option_b                TEXT                NOT NULL,
    option_c                TEXT                NOT NULL,
    option_d                TEXT                NOT NULL,
    correct_answer          VARCHAR(1)          NOT NULL,
    explanation             TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reading_questions_lesson
        FOREIGN KEY (reading_lesson_id)
        REFERENCES reading_lessons(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_reading_questions_lesson_order
        UNIQUE (reading_lesson_id, question_order),

    CONSTRAINT chk_correct_answer
        CHECK (correct_answer IN ('A', 'B', 'C', 'D'))
);

COMMENT ON TABLE reading_questions IS 'Câu hỏi thuộc bài học đọc hiểu';
COMMENT ON COLUMN reading_questions.question_order IS 'Thứ tự câu hỏi trong bài';
COMMENT ON COLUMN reading_questions.correct_answer IS 'Đáp án đúng: A, B, C hoặc D';
COMMENT ON COLUMN reading_questions.explanation IS 'Giải thích đáp án đúng';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_reading_questions_lesson_id ON reading_questions(reading_lesson_id);
CREATE INDEX idx_reading_questions_order ON reading_questions(reading_lesson_id, question_order);
