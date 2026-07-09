-- ============================================================
-- V21__listening_questions.sql
-- BE-LISTEN-02 - Listening Question Backend Foundation
-- PostgreSQL / Supabase
-- ============================================================

-- ============================================================
-- Listening Questions
-- ============================================================

CREATE TABLE listening_questions (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    listening_lesson_id     UUID                NOT NULL,
    question_order          INTEGER             NOT NULL,
    question_type           VARCHAR(20)         NOT NULL,
    question                TEXT                NOT NULL,
    option_a                TEXT                NOT NULL,
    option_b                TEXT                NOT NULL,
    option_c                TEXT                NOT NULL,
    option_d                TEXT                NOT NULL,
    correct_answer          VARCHAR(1)          NOT NULL,
    explanation             TEXT,
    audio_url               TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_listening_questions_lesson
        FOREIGN KEY (listening_lesson_id)
        REFERENCES listening_lessons(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_listening_questions_lesson_order
        UNIQUE (listening_lesson_id, question_order),

    CONSTRAINT chk_listening_correct_answer
        CHECK (correct_answer IN ('A', 'B', 'C', 'D')),

    CONSTRAINT chk_listening_question_type
        CHECK (question_type IN ('MULTIPLE_CHOICE', 'DICTATION', 'FILL_IN_BLANK'))
);

COMMENT ON TABLE listening_questions IS 'Câu hỏi thuộc bài học nghe hiểu';
COMMENT ON COLUMN listening_questions.question_order IS 'Thứ tự câu hỏi trong bài';
COMMENT ON COLUMN listening_questions.question_type IS 'Loại bài tập nghe: MULTIPLE_CHOICE, DICTATION, FILL_IN_BLANK';
COMMENT ON COLUMN listening_questions.correct_answer IS 'Đáp án đúng: A, B, C hoặc D';
COMMENT ON COLUMN listening_questions.explanation IS 'Giải thích đáp án đúng';
COMMENT ON COLUMN listening_questions.audio_url IS 'Audio clip riêng cho câu hỏi nghe, nếu có';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_listening_questions_lesson_id ON listening_questions(listening_lesson_id);
CREATE INDEX idx_listening_questions_order ON listening_questions(listening_lesson_id, question_order);
