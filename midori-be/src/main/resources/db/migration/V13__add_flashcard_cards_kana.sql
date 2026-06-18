-- ============================================================
-- V13__add_flashcard_cards_kana.sql
-- Adds kana/reading field for flashcard cards
-- ============================================================

ALTER TABLE flashcard_cards
ADD COLUMN IF NOT EXISTS kana VARCHAR(500);

UPDATE flashcard_cards
SET kana = COALESCE(NULLIF(kana, ''), NULLIF(front_text, ''), NULLIF(back_text, ''), '')
WHERE kana IS NULL OR kana = '';

ALTER TABLE flashcard_cards
ALTER COLUMN kana SET NOT NULL;

COMMENT ON COLUMN flashcard_cards.kana IS 'Kana/reading for the flashcard front text';
