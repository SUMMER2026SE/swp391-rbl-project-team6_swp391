-- ============================================================
-- V28__vocabulary_flashcard.sql
-- Module: Vocabulary + Flashcard
--
-- Consolidates:
--   V13 (add_flashcard_cards_meaning)
--   V14 (add_flashcard_cards_kana)
--   V31 (add is_published + word_count to vocabulary_lessons)
--
-- Depends on: V1 (vocabulary_lessons, vocabulary_words),
--             V6 (flashcard_sets, flashcard_cards).
-- ============================================================

-- ============================================================
-- VOCABULARY (V1 schema + V31 fix columns + backfill word_count)
-- ============================================================
ALTER TABLE vocabulary_lessons
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE vocabulary_lessons
    ADD COLUMN IF NOT EXISTS word_count    INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN vocabulary_lessons.is_published IS 'Trạng thái xuất bản: TRUE = đã publish';
COMMENT ON COLUMN vocabulary_lessons.word_count    IS 'Số từ vựng trong bài học';

-- ============================================================
-- FLASHCARD CARDS — add meaning + kana (V13 + V14)
-- ============================================================
ALTER TABLE flashcard_cards
    ADD COLUMN IF NOT EXISTS meaning VARCHAR(1000);

UPDATE flashcard_cards
SET meaning = COALESCE(NULLIF(meaning, ''), NULLIF(back_text, ''), NULLIF(front_text, ''), '')
WHERE meaning IS NULL OR meaning = '';

ALTER TABLE flashcard_cards
    ALTER COLUMN meaning SET NOT NULL;

COMMENT ON COLUMN flashcard_cards.meaning IS 'Meaning/translation for the flashcard card';

ALTER TABLE flashcard_cards
    ADD COLUMN IF NOT EXISTS kana VARCHAR(500);

UPDATE flashcard_cards
SET kana = COALESCE(NULLIF(kana, ''), NULLIF(front_text, ''), NULLIF(back_text, ''), '')
WHERE kana IS NULL OR kana = '';

ALTER TABLE flashcard_cards
    ALTER COLUMN kana SET NOT NULL;

COMMENT ON COLUMN flashcard_cards.kana IS 'Kana/reading for the flashcard front text';