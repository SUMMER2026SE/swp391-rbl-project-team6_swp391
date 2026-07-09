-- ============================================================
-- V20__listening_content.sql
-- BE-LISTEN-01 - Listening Lesson Backend Foundation
-- PostgreSQL / Supabase
-- ============================================================

-- ============================================================
-- Listening Lessons
-- ============================================================

CREATE TABLE listening_lessons (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    jlpt_level              VARCHAR(10)         NOT NULL,
    lesson_number           INTEGER             NOT NULL,
    title                   VARCHAR(255)        NOT NULL,
    description             TEXT,
    audio_url               TEXT,
    transcript              TEXT,
    estimated_minutes       INTEGER,
    difficulty              VARCHAR(20),
    is_active               BOOLEAN             NOT NULL    DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_listening_lesson_level_number UNIQUE (jlpt_level, lesson_number)
);

COMMENT ON TABLE listening_lessons IS 'Bài học nghe hiểu - Listening comprehension lessons';
COMMENT ON COLUMN listening_lessons.jlpt_level IS 'JLPT level: N5, N4, N3, N2, N1';
COMMENT ON COLUMN listening_lessons.lesson_number IS 'Số thứ tự bài học trong mỗi level';
COMMENT ON COLUMN listening_lessons.audio_url IS 'URL to audio file for listening exercise';
COMMENT ON COLUMN listening_lessons.transcript IS 'Transcript of the audio content';
COMMENT ON COLUMN listening_lessons.difficulty IS 'Độ khó: EASY, MEDIUM, HARD';
COMMENT ON COLUMN listening_lessons.is_active IS 'Trạng thái kích hoạt: TRUE = đang hoạt động';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_listening_lessons_jlpt_level ON listening_lessons(jlpt_level);
CREATE INDEX idx_listening_lessons_lesson_number ON listening_lessons(lesson_number);
CREATE INDEX idx_listening_lessons_difficulty ON listening_lessons(difficulty);
CREATE INDEX idx_listening_lessons_is_active ON listening_lessons(is_active);
CREATE INDEX idx_listening_lessons_level_active ON listening_lessons(jlpt_level, is_active);
