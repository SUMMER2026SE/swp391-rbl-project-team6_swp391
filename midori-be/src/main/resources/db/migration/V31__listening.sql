-- ============================================================
-- V31__listening.sql
-- Module: Listening
--
-- Consolidates:
--   V9  (listening_lessons legacy columns + FK teacher)
--   V12 (listening_lessons.exercise_type)
--   V19 (listening_lessons jlpt/lesson_number architecture — runs in V19,
--        but V20 creates listening_questions table)
--   V20 (listening_questions with question_type)
--   V32 (drop NOT NULL on teacher_id + status for admin-managed flow)
--   V37 (rename listening_questions -> listening_items, ensure
--        question_order NOT NULL, audio_url NOT NULL, drop audio_url
--        on listening_lessons)
--
-- Depends on: V9 (listening_lessons), V20 (listening_questions).
-- ============================================================

-- ============================================================
-- LISTENING LESSONS — final shape
-- ============================================================
CREATE TABLE IF NOT EXISTS listening_lessons (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    jlpt_level              VARCHAR(10)     NOT NULL,
    lesson_number           INTEGER         NOT NULL,
    title                   VARCHAR(255)    NOT NULL,
    description             TEXT,
    audio_url               TEXT,
    transcript              TEXT,
    estimated_minutes       INTEGER,
    difficulty              VARCHAR(20),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    -- legacy / admin-managed fields (nullable after V32 fix)
    teacher_id              UUID,
    status                  VARCHAR(50)     DEFAULT 'PENDING',
    approved_by             UUID,
    approved_at             TIMESTAMPTZ,
    audio_file_name         VARCHAR(255),
    audio_type              VARCHAR(50),
    exercise_type           VARCHAR(50),
    answer_key              TEXT,
    topic                   VARCHAR(100),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_listening_lesson_level_number UNIQUE (jlpt_level, lesson_number)
);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_jlpt_level    ON listening_lessons(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_lesson_number ON listening_lessons(lesson_number);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_difficulty    ON listening_lessons(difficulty);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_is_active     ON listening_lessons(is_active);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_level_active  ON listening_lessons(jlpt_level, is_active);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_teacher_id    ON listening_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_status        ON listening_lessons(status);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_exercise_type ON listening_lessons(exercise_type);
CREATE INDEX IF NOT EXISTS idx_listening_lessons_topic          ON listening_lessons(topic);

-- V32 fix: drop NOT NULL on teacher_id + status (admin-managed flow)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listening_lessons' AND column_name = 'teacher_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE listening_lessons ALTER COLUMN teacher_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listening_lessons' AND column_name = 'status' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE listening_lessons ALTER COLUMN status DROP NOT NULL;
    END IF;
END $$;

-- ============================================================
-- LISTENING ITEMS — V37 rename listening_questions -> listening_items
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'listening_questions'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'listening_items'
    ) THEN
        ALTER TABLE listening_questions RENAME TO listening_items;
    END IF;
END $$;

-- Rename constraints/indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_listening_questions_lesson'
    ) THEN
        ALTER TABLE listening_items
            RENAME CONSTRAINT fk_listening_questions_lesson TO fk_listening_items_lesson;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listening_questions_lesson_id') THEN
        ALTER INDEX idx_listening_questions_lesson_id RENAME TO idx_listening_items_lesson_id;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listening_questions_order') THEN
        ALTER INDEX idx_listening_questions_order RENAME TO idx_listening_items_order;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'uq_listening_questions_lesson_order'
    ) THEN
        ALTER TABLE listening_items
            RENAME CONSTRAINT uq_listening_questions_lesson_order TO uq_listening_items_lesson_order;
    END IF;
END $$;

-- Ensure question_order NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listening_items' AND column_name = 'question_order' AND is_nullable = 'YES'
    ) THEN
        UPDATE listening_items SET question_order = 1 WHERE question_order IS NULL;
        ALTER TABLE listening_items ALTER COLUMN question_order SET NOT NULL;
    END IF;
END $$;

-- Ensure audio_url NOT NULL on the item
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listening_items' AND column_name = 'audio_url' AND is_nullable = 'YES'
    ) THEN
        UPDATE listening_items SET audio_url = '' WHERE audio_url IS NULL;
        ALTER TABLE listening_items ALTER COLUMN audio_url SET NOT NULL;
    END IF;
END $$;

-- Reaffirm UK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'uq_listening_items_lesson_order'
    ) THEN
        ALTER TABLE listening_items
            ADD CONSTRAINT uq_listening_items_lesson_order UNIQUE (listening_lesson_id, question_order);
    END IF;
END $$;

-- Drop old question_type CHECK (V37)
ALTER TABLE listening_items DROP CONSTRAINT IF EXISTS chk_listening_question_type;

-- V37: remove audio_url from listening_lessons (audio belongs to each item)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listening_lessons' AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE listening_lessons DROP COLUMN audio_url;
    END IF;
END $$;

COMMENT ON TABLE listening_items IS 'Mỗi listening item là một câu nghe hoàn chỉnh (audio + question + 4 đáp án)';
COMMENT ON COLUMN listening_items.question_order IS 'Thứ tự của item trong bài listening';
COMMENT ON COLUMN listening_items.audio_url IS 'Audio riêng cho từng item';
COMMENT ON COLUMN listening_items.correct_answer IS 'Đáp án đúng: A, B, C hoặc D';

-- ============================================================
-- Backfill: link listening_lessons -> shared lessons (created in V27)
-- ============================================================
DO $$
DECLARE inserted INTEGER := 0;
BEGIN
    INSERT INTO lessons (level, lesson_number, title, description, order_index)
    SELECT ll.jlpt_level, ll.lesson_number,
           COALESCE(ll.title, 'Listening Lesson'), ll.description,
           COALESCE(ll.lesson_number, 0)
    FROM listening_lessons ll
    ON CONFLICT (level, lesson_number) DO NOTHING;

    GET DIAGNOSTICS inserted = ROW_COUNT;
    RAISE NOTICE 'Backfilled listening lessons into lessons: %', inserted;
END $$;

UPDATE listening_lessons ll
SET lesson_id = l.id
FROM lessons l
WHERE l.level = ll.jlpt_level
  AND l.lesson_number = ll.lesson_number
  AND ll.lesson_id IS NULL;