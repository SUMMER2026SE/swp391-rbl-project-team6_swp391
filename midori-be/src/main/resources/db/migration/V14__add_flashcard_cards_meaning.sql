-- ============================================================
-- V14__add_flashcard_cards_meaning.sql
-- Adds meaning/translation field for flashcard cards
-- ============================================================

ALTER TABLE flashcard_cards
ADD COLUMN IF NOT EXISTS meaning VARCHAR(1000);

UPDATE flashcard_cards
SET meaning = COALESCE(NULLIF(meaning, ''), NULLIF(back_text, ''), NULLIF(front_text, ''), '')
WHERE meaning IS NULL OR meaning = '';

ALTER TABLE flashcard_cards
ALTER COLUMN meaning SET NOT NULL;

COMMENT ON COLUMN flashcard_cards.meaning IS 'Meaning/translation for the flashcard card';
