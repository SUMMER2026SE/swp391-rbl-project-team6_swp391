-- ============================================================
-- V27__learning_journey.sql
-- Module: Learning Journey (shared lessons)
--
-- Consolidates: V30 (lessons + backfill) → chỉ phần "lessons"
--                V32 (listening_lessons nullable teacher_id/status)
--                V33 / V340 (grammar_examples FK to grammar_content_id)
--                V31 (vocabulary_lessons.is_published + word_count)
--                V37 (rename listening_questions → listening_items +
--                     drop listening_lessons.audio_url)
--
-- Depends on: V1..V21 (vocabulary_lessons + grammar_lessons + listening_lessons
--                       + listening_questions đã được V1/V17/V20/V19 tạo).
-- ============================================================

-- ============================================================
-- SHARED LESSONS (single source of truth for the Learning Journey)
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    level           VARCHAR(10)     NOT NULL,
    lesson_number   INTEGER         NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    order_index     INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_lessons_level_number UNIQUE (level, lesson_number)
);
CREATE INDEX IF NOT EXISTS idx_lessons_level_number ON lessons(level, lesson_number);
CREATE INDEX IF NOT EXISTS idx_lessons_order        ON lessons(order_index);

COMMENT ON TABLE lessons IS 'Single source of truth for lessons across all skills';

-- ============================================================
-- FK từ skill lessons -> shared lessons
-- (V4 grammar_lessons, V19 listening_lessons, V17 reading_lessons, V30 vocab)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_grammar_lesson_lesson') THEN
        ALTER TABLE grammar_lessons
            ADD CONSTRAINT fk_grammar_lesson_lesson
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_vocabulary_lesson_lesson') THEN
        ALTER TABLE vocabulary_lessons
            ADD CONSTRAINT fk_vocabulary_lesson_lesson
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reading_lesson_lesson') THEN
        ALTER TABLE reading_lessons
            ADD CONSTRAINT fk_reading_lesson_lesson
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_listening_lesson_lesson') THEN
        ALTER TABLE listening_lessons
            ADD CONSTRAINT fk_listening_lesson_lesson
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================
-- Indexes on FK columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_lesson_id    ON grammar_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lessons_lesson_id ON vocabulary_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_reading_lessons_lesson_id    ON reading_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_lesson_id  ON listening_lessons(lesson_id);