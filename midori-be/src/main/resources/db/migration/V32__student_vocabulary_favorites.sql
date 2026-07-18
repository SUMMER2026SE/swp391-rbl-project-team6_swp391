-- ============================================================
-- V32__student_vocabulary_favorites.sql
-- Module: Student Vocabulary Favorites
--
-- Consolidates: V38 (student_vocabulary_favorites)
--
-- Depends on: V1 (vocabulary_words must exist for FK).
-- Note: in current code the entity maps to vocabulary_items, but
-- V1 created vocabulary_words and the existing FK from V38 is
-- vocabulary_item_id → vocabulary_items. Both tables exist
-- (vocabulary_items created by V30 legacy). We point FK at
-- vocabulary_items to match JPA entity StudentVocabularyFavorite.
-- ============================================================

CREATE TABLE IF NOT EXISTS student_vocabulary_favorites (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_item_id  UUID,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Add FK to vocabulary_items if it exists, otherwise to vocabulary_words
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vocabulary_items') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_vocabulary_favorites_vocabulary_item'
        ) THEN
            ALTER TABLE student_vocabulary_favorites
                ADD CONSTRAINT fk_student_vocabulary_favorites_vocabulary_item
                FOREIGN KEY (vocabulary_item_id) REFERENCES vocabulary_items(id) ON DELETE CASCADE;
        END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vocabulary_words') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_vocabulary_favorites_vocabulary_word'
        ) THEN
            ALTER TABLE student_vocabulary_favorites
                ADD CONSTRAINT fk_student_vocabulary_favorites_vocabulary_word
                FOREIGN KEY (vocabulary_item_id) REFERENCES vocabulary_words(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_vocabulary_favorite'
    ) THEN
        ALTER TABLE student_vocabulary_favorites
            ADD CONSTRAINT uq_student_vocabulary_favorite UNIQUE (student_id, vocabulary_item_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_vocabulary_favorites_student_id  ON student_vocabulary_favorites(student_id);
CREATE INDEX IF NOT EXISTS idx_student_vocabulary_favorites_item_id     ON student_vocabulary_favorites(vocabulary_item_id);

COMMENT ON TABLE student_vocabulary_favorites IS 'Lưu trữ các từ vựng đã được học sinh đánh dấu là yêu thích';
COMMENT ON COLUMN student_vocabulary_favorites.student_id IS 'ID của học sinh';
COMMENT ON COLUMN student_vocabulary_favorites.vocabulary_item_id IS 'ID của từ vựng được đánh dấu';