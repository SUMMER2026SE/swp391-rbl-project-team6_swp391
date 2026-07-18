-- ============================================================
-- V30__reading.sql
-- Module: Reading
--
-- Consolidates:
--   V35 (reading_passages + reading_questions.reading_passage_id + FK)
--   V36 / V102 / V200 / V300 (final UK: (reading_passage_id, question_order))
--
-- Depends on: V17 (reading_lessons), V18 (reading_questions initial).
-- ============================================================

-- ============================================================
-- READING PASSAGES (V35)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_passages (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_lesson_id       UUID            NOT NULL REFERENCES reading_lessons(id) ON DELETE CASCADE,
    passage_order           INTEGER         NOT NULL,
    passage                 TEXT            NOT NULL,
    vietnamese_translation  TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reading_passages_lesson_order UNIQUE (reading_lesson_id, passage_order)
);
CREATE INDEX IF NOT EXISTS idx_reading_passages_lesson_id ON reading_passages(reading_lesson_id);
CREATE INDEX IF NOT EXISTS idx_reading_passages_order    ON reading_passages(reading_lesson_id, passage_order);

COMMENT ON TABLE reading_passages IS 'Đoạn văn trong bài học đọc hiểu';

-- ============================================================
-- READING QUESTIONS — add reading_passage_id column + FK (V35)
-- ============================================================
ALTER TABLE reading_questions
    ADD COLUMN IF NOT EXISTS reading_passage_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_reading_questions_passage'
    ) THEN
        ALTER TABLE reading_questions
            ADD CONSTRAINT fk_reading_questions_passage
            FOREIGN KEY (reading_passage_id)
            REFERENCES reading_passages(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- V36 / V102 / V200 / V300 — final UK:
--   UNIQUE(reading_passage_id, question_order)
-- (previously was UNIQUE(reading_lesson_id, question_order) created by V18)
-- ============================================================
ALTER TABLE reading_questions DROP CONSTRAINT IF EXISTS uq_reading_questions_lesson_order;
ALTER TABLE reading_questions DROP CONSTRAINT IF EXISTS uk_reading_questions_lesson_order;

DO $$
DECLARE cons record;
BEGIN
    FOR cons IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'reading_questions'::regclass
          AND contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE reading_questions DROP CONSTRAINT IF EXISTS %I', cons.conname);
    END LOOP;
END $$;

ALTER TABLE reading_questions
    ADD CONSTRAINT uk_reading_questions_passage_order UNIQUE (reading_passage_id, question_order);

CREATE INDEX IF NOT EXISTS idx_reading_questions_passage_id
    ON reading_questions(reading_passage_id);