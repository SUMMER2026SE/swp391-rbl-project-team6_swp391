-- ============================================================
-- V17__reading_content.sql
-- BE-READ-01 - Reading Lesson Backend Foundation
-- PostgreSQL / Supabase
-- ============================================================

-- ============================================================
-- Reading Lessons
-- ============================================================

CREATE TABLE reading_lessons (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    jlpt_level              VARCHAR(10)         NOT NULL,
    lesson_number           INTEGER             NOT NULL,
    title                   VARCHAR(255)        NOT NULL,
    description             TEXT,
    passage                 TEXT                NOT NULL,
    vietnamese_translation  TEXT,
    estimated_minutes       INTEGER,
    difficulty              VARCHAR(20),
    is_active               BOOLEAN             NOT NULL    DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_reading_lesson_level_number UNIQUE (jlpt_level, lesson_number)
);

COMMENT ON TABLE reading_lessons IS 'Bài học đọc hiểu - Reading comprehension lessons';
COMMENT ON COLUMN reading_lessons.jlpt_level IS 'JLPT level: N5, N4, N3, N2, N1';
COMMENT ON COLUMN reading_lessons.lesson_number IS 'Số thứ tự bài học trong mỗi level';
COMMENT ON COLUMN reading_lessons.passage IS 'Nội dung bài đọc tiếng Nhật';
COMMENT ON COLUMN reading_lessons.vietnamese_translation IS 'Bản dịch tiếng Việt của bài đọc';
COMMENT ON COLUMN reading_lessons.difficulty IS 'Độ khó: EASY, MEDIUM, HARD';
COMMENT ON COLUMN reading_lessons.is_active IS 'Trạng thái kích hoạt: TRUE = đang hoạt động';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_reading_lessons_jlpt_level ON reading_lessons(jlpt_level);
CREATE INDEX idx_reading_lessons_lesson_number ON reading_lessons(lesson_number);
CREATE INDEX idx_reading_lessons_difficulty ON reading_lessons(difficulty);
CREATE INDEX idx_reading_lessons_is_active ON reading_lessons(is_active);
CREATE INDEX idx_reading_lessons_level_active ON reading_lessons(jlpt_level, is_active);
