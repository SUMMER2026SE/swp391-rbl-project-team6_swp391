-- ============================================================
-- V31__add_kanji_svg_file.sql
-- Add svg_file column to kanji_entries table
-- and backfill existing rows using Unicode code point
-- PostgreSQL / Supabase
-- ============================================================

ALTER TABLE kanji_entries ADD COLUMN IF NOT EXISTS svg_file VARCHAR(50);

COMMENT ON COLUMN kanji_entries.svg_file IS 'KanjiVG SVG filename (e.g. 098df.svg), precomputed from Unicode code point';

-- Backfill svg_file for all existing rows
-- ascii() returns the Unicode code point of the first character
-- to_hex() converts to hex, lpad() ensures 5-digit zero-padded format
UPDATE kanji_entries
SET svg_file = LPAD(TO_HEX(ASCII("character")), 5, '0') || '.svg'
WHERE svg_file IS NULL;

CREATE INDEX IF NOT EXISTS idx_kanji_entries_svg_file ON kanji_entries(svg_file);
