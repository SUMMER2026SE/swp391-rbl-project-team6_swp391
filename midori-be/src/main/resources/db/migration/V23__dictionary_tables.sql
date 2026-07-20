-- ============================================================
-- V23__dictionary_tables.sql
-- Dictionary Module Database Tables
-- PostgreSQL / Supabase
-- ============================================================

-- ============================================================
-- Dictionary Entries Table
-- ============================================================
CREATE TABLE IF NOT EXISTS dictionary_entries (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    surface             VARCHAR(255)        NOT NULL,
    lemma               VARCHAR(255),
    reading             VARCHAR(255),
    romaji              VARCHAR(255),
    jlpt_level          VARCHAR(50),
    part_of_speech      VARCHAR(255),
    frequency           INTEGER,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dictionary_entries IS 'Japanese dictionary headwords and entries';
COMMENT ON COLUMN dictionary_entries.surface IS 'The original surface text of the word';
COMMENT ON COLUMN dictionary_entries.lemma IS 'Dictionary base form/lemma of the word';
COMMENT ON COLUMN dictionary_entries.reading IS 'Kana reading of the word';
COMMENT ON COLUMN dictionary_entries.romaji IS 'Romanized spelling of the word';
COMMENT ON COLUMN dictionary_entries.jlpt_level IS 'JLPT level: N5, N4, N3, N2, N1';
COMMENT ON COLUMN dictionary_entries.part_of_speech IS 'Part of speech classifications';
COMMENT ON COLUMN dictionary_entries.frequency IS 'Relative frequency index of the word';

-- ============================================================
-- Dictionary Meanings Table
-- ============================================================
CREATE TABLE IF NOT EXISTS dictionary_meanings (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id            UUID                NOT NULL,
    language            VARCHAR(50)         NOT NULL,
    meaning             TEXT                NOT NULL,
    sort_order          INTEGER             NOT NULL DEFAULT 0,

    CONSTRAINT fk_dictionary_meaning_entry
        FOREIGN KEY (entry_id)
        REFERENCES dictionary_entries(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE dictionary_meanings IS 'Translated meanings for dictionary entries';
COMMENT ON COLUMN dictionary_meanings.language IS 'Target language of the translation (e.g., vi, en, ja)';
COMMENT ON COLUMN dictionary_meanings.meaning IS 'The definition or translation text';
COMMENT ON COLUMN dictionary_meanings.sort_order IS 'Ordering for multiple definitions';

-- ============================================================
-- Dictionary Examples Table
-- ============================================================
CREATE TABLE IF NOT EXISTS dictionary_examples (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id            UUID                NOT NULL,
    japanese            TEXT                NOT NULL,
    reading             VARCHAR(255),
    translation         TEXT                NOT NULL,
    sort_order          INTEGER             NOT NULL DEFAULT 0,

    CONSTRAINT fk_dictionary_example_entry
        FOREIGN KEY (entry_id)
        REFERENCES dictionary_entries(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE dictionary_examples IS 'Example sentences for dictionary entries';
COMMENT ON COLUMN dictionary_examples.japanese IS 'Example sentence in Japanese';
COMMENT ON COLUMN dictionary_examples.reading IS 'Furigana or reading for the example sentence';
COMMENT ON COLUMN dictionary_examples.translation IS 'Translation of the example sentence';
COMMENT ON COLUMN dictionary_examples.sort_order IS 'Ordering for multiple example sentences';

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_surface ON dictionary_entries(surface);
CREATE INDEX IF NOT EXISTS idx_dictionary_meanings_entry_id ON dictionary_meanings(entry_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_examples_entry_id ON dictionary_examples(entry_id);
