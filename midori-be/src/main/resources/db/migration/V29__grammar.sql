-- ============================================================
-- V29__grammar.sql
-- Module: Grammar
--
-- Consolidates:
--   V11 (grammar_pending_update: add pending_* columns)
--   V30 (grammar_lessons / grammar_contents / grammar_examples
--        + backfill NULL grammar_content_id + grammar_lesson_id FK)
--   V33 / V340 (ensure grammar_examples.grammar_content_id NOT NULL + FK)
--
-- Depends on: V4 (grammars), V30 legacy (grammar_lessons/contents/examples).
-- ============================================================

-- ============================================================
-- GRAMMAR (V4) — add pending-update columns (V11)
-- ============================================================
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS has_pending_update BOOLEAN DEFAULT FALSE;
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_title          VARCHAR(255);
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_pattern        TEXT;
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_meaning        TEXT;
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_structure      TEXT;
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_usage          TEXT;
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_examples       TEXT;
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_example_meanings TEXT;
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_level          VARCHAR(10);
ALTER TABLE grammars ADD COLUMN IF NOT EXISTS pending_update_reject_reason VARCHAR(1000);

COMMENT ON COLUMN grammars.has_pending_update IS 'True khi teacher đã edit bài APPROVED và đang chờ admin duyệt';
COMMENT ON COLUMN grammars.pending_examples IS 'Ví dụ mới chờ duyệt (JSON array)';

CREATE INDEX IF NOT EXISTS idx_grammars_has_pending_update
    ON grammars(has_pending_update) WHERE has_pending_update = TRUE;

-- ============================================================
-- GRAMMAR LESSONS / CONTENTS / EXAMPLES  (V30 final shape)
-- ============================================================
CREATE TABLE IF NOT EXISTS grammar_lessons (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    jlpt_level              VARCHAR(10)     NOT NULL,
    lesson_number           INTEGER         NOT NULL,
    title                   VARCHAR(255)    NOT NULL,
    description             TEXT,
    estimated_minutes       INTEGER,
    difficulty              VARCHAR(20),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    lesson_id               UUID,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_grammar_lesson_level_number UNIQUE (jlpt_level, lesson_number)
);
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_jlpt_level    ON grammar_lessons(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_lesson_number ON grammar_lessons(lesson_number);
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_difficulty    ON grammar_lessons(difficulty);
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_is_active     ON grammar_lessons(is_active);
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_level_active  ON grammar_lessons(jlpt_level, is_active);

CREATE TABLE IF NOT EXISTS grammar_contents (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    grammar_lesson_id       UUID            NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    content_order           INTEGER         NOT NULL,
    pattern                 TEXT,
    meaning                 TEXT,
    structure               TEXT,
    usage                   TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_grammar_contents_lesson_order UNIQUE (grammar_lesson_id, content_order)
);
CREATE INDEX IF NOT EXISTS idx_grammar_contents_lesson_id ON grammar_contents(grammar_lesson_id);
CREATE INDEX IF NOT EXISTS idx_grammar_contents_order    ON grammar_contents(grammar_lesson_id, content_order);

CREATE TABLE IF NOT EXISTS grammar_examples (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    grammar_content_id      UUID            NOT NULL REFERENCES grammar_contents(id) ON DELETE CASCADE,
    example_order           INTEGER         NOT NULL,
    japanese                TEXT            NOT NULL,
    vietnamese_meaning      TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_grammar_examples_content_order UNIQUE (grammar_content_id, example_order)
);
CREATE INDEX IF NOT EXISTS idx_grammar_examples_content_id     ON grammar_examples(grammar_content_id);
CREATE INDEX IF NOT EXISTS idx_grammar_examples_content_order  ON grammar_examples(grammar_content_id, example_order);

-- ============================================================
-- V33/V340 fix: add grammar_content_id + backfill NULLs
-- ============================================================
ALTER TABLE grammar_examples
    ADD COLUMN IF NOT EXISTS grammar_content_id UUID;

DO $$
DECLARE
    lesson_rec RECORD;
    content_id UUID;
BEGIN
    -- For each grammar lesson, ensure it has at least one grammar_content
    FOR lesson_rec IN
        SELECT DISTINCT g.id AS lesson_id
        FROM grammars g
        WHERE NOT EXISTS (
            SELECT 1 FROM grammar_contents gc WHERE gc.grammar_lesson_id = g.id
        )
    LOOP
        INSERT INTO grammar_contents (grammar_lesson_id, content_order, pattern, meaning, usage)
        VALUES (lesson_rec.lesson_id, 1, 'Legacy pattern', 'Legacy meaning', 'Legacy usage')
        RETURNING id INTO content_id;

        UPDATE grammar_examples ge
        SET grammar_content_id = content_id
        WHERE ge.grammar_content_id IS NULL;
    END LOOP;

    -- If still NULL examples exist, assign them to the first available content
    IF EXISTS (SELECT 1 FROM grammar_examples WHERE grammar_content_id IS NULL) THEN
        SELECT id INTO content_id FROM grammar_contents LIMIT 1;
        IF content_id IS NOT NULL THEN
            UPDATE grammar_examples
            SET grammar_content_id = content_id
            WHERE grammar_content_id IS NULL;
        END IF;
    END IF;
END $$;

-- Drop redundant grammar_lesson_id column if it exists (V340)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'grammar_examples'
          AND column_name = 'grammar_lesson_id'
    ) THEN
        ALTER TABLE grammar_examples DROP COLUMN IF EXISTS grammar_lesson_id;
    END IF;
END $$;

-- Now make grammar_content_id NOT NULL and add FK
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM grammar_examples WHERE grammar_content_id IS NULL
    ) THEN
        UPDATE grammar_examples ge
        SET grammar_content_id = (
            SELECT gc.id FROM grammar_contents gc LIMIT 1
        )
        WHERE ge.grammar_content_id IS NULL;
    END IF;
END $$;

ALTER TABLE grammar_examples
    ALTER COLUMN grammar_content_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_grammar_examples_content'
    ) THEN
        ALTER TABLE grammar_examples
            ADD CONSTRAINT fk_grammar_examples_content
            FOREIGN KEY (grammar_content_id)
            REFERENCES grammar_contents(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- V30 backfill: copy grammar lessons -> shared lessons, link via FK
-- (Learning Journey table was created in V27)
-- ============================================================
DO $$
DECLARE inserted INTEGER := 0;
BEGIN
    INSERT INTO lessons (level, lesson_number, title, description, order_index)
    SELECT gl.jlpt_level, gl.lesson_number,
           COALESCE(gl.title, 'Grammar Lesson'), gl.description,
           COALESCE(gl.lesson_number, 0)
    FROM grammar_lessons gl
    ON CONFLICT (level, lesson_number) DO NOTHING;

    GET DIAGNOSTICS inserted = ROW_COUNT;
    RAISE NOTICE 'Backfilled grammar lessons into lessons: %', inserted;
END $$;

UPDATE grammar_lessons gl
SET lesson_id = l.id
FROM lessons l
WHERE l.level = gl.jlpt_level
  AND l.lesson_number = gl.lesson_number
  AND gl.lesson_id IS NULL;

-- ============================================================
-- V30 backfill: ensure every grammar lesson has at least one content
-- ============================================================
DO $$
DECLARE lesson_record RECORD;
BEGIN
    FOR lesson_record IN
        SELECT gl.id AS lesson_id
        FROM grammar_lessons gl
        WHERE NOT EXISTS (
            SELECT 1 FROM grammar_contents gc WHERE gc.grammar_lesson_id = gl.id
        )
    LOOP
        INSERT INTO grammar_contents (grammar_lesson_id, content_order)
        VALUES (lesson_record.lesson_id, 1);
    END LOOP;
END $$;