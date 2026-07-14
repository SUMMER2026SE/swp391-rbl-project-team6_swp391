-- ============================================================
-- V27__create_kanji_entries.sql
-- Create kanji_entries table to import KANJIDIC2
-- PostgreSQL / Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS kanji_entries (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    "character"         VARCHAR(10)         NOT NULL UNIQUE,
    onyomi              TEXT,
    kunyomi             TEXT,
    stroke_count        INTEGER,
    radical             VARCHAR(50),
    jlpt                VARCHAR(50),
    meaning             TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE kanji_entries IS 'Japanese kanji dictionary entries';
COMMENT ON COLUMN kanji_entries."character" IS 'The single kanji character';
COMMENT ON COLUMN kanji_entries.onyomi IS 'Comma-separated Onyomi (Chinese readings)';
COMMENT ON COLUMN kanji_entries.kunyomi IS 'Comma-separated Kunyomi (Japanese readings)';
COMMENT ON COLUMN kanji_entries.stroke_count IS 'Total stroke count';
COMMENT ON COLUMN kanji_entries.radical IS 'Classical radical identifier';
COMMENT ON COLUMN kanji_entries.jlpt IS 'Estimated JLPT level (N1-N5)';
COMMENT ON COLUMN kanji_entries.meaning IS 'Comma-separated English meanings';

CREATE INDEX IF NOT EXISTS idx_kanji_entries_character ON kanji_entries("character");
