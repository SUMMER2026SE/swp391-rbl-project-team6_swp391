-- ============================================================
-- V30__extend_jmdict_schema.sql
-- Extended schema for JMdict full dictionary (~180,000 entries)
-- PostgreSQL / Supabase
-- ============================================================

-- Add JMdict-specific columns to dictionary_entries
ALTER TABLE dictionary_entries
    ADD COLUMN IF NOT EXISTS jmdict_seq BIGINT,
    ADD COLUMN IF NOT EXISTS jmdict_pri VARCHAR(255),
    ADD COLUMN IF NOT EXISTS jmdict_ke_inf VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_re_inf VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_ke_pri VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_re_pri VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_stagk VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_stagr VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_dial VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_field VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_misc VARCHAR(255)[],
    ADD COLUMN IF NOT EXISTS jmdict_lsource XMLTYPE,
    ADD COLUMN IF NOT EXISTS jmdict_raw_xml TEXT;

-- Add constraints
ALTER TABLE dictionary_entries
    ADD CONSTRAINT unique_jmdict_seq UNIQUE (jmdict_seq);

-- Add meaning-specific fields
ALTER TABLE dictionary_meanings
    ADD COLUMN IF NOT EXISTS jmdict_g_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS jmdict_xref TEXT,
    ADD COLUMN IF NOT EXISTS jmdict_ant TEXT,
    ADD COLUMN IF NOT EXISTS jmdict_s_inf TEXT;

-- ============================================================
-- Create full-text search index for Japanese text
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_dictionary_entries_surface_trgm ON dictionary_entries USING gin (surface gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_reading_trgm ON dictionary_entries USING gin (reading gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_lemma_trgm ON dictionary_entries USING gin (lemma gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_jmdict_seq ON dictionary_entries(jmdict_seq);

-- Full-text search index for meanings
CREATE INDEX IF NOT EXISTS idx_dictionary_meanings_meaning_trgm ON dictionary_meanings USING gin (meaning gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dictionary_meanings_language ON dictionary_meanings(language);
CREATE INDEX IF NOT EXISTS idx_dictionary_meanings_entry_id ON dictionary_meanings(entry_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_search ON dictionary_entries(surface, reading, lemma);
CREATE INDEX IF NOT EXISTS idx_dictionary_meanings_entry_lang ON dictionary_meanings(entry_id, language);

-- ============================================================
-- Create table for JMdict raw entries (for backup/reprocessing)
-- ============================================================
CREATE TABLE IF NOT EXISTS jmdict_raw_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ent_seq         BIGINT NOT NULL,
    raw_xml         TEXT NOT NULL,
    keb             TEXT[],
    reb             TEXT[] NOT NULL,
    priority        VARCHAR(50),
    pos             TEXT[],
    glosses         TEXT[],
    dialect         TEXT[],
    field           TEXT[],
    misc            TEXT[],
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ent_seq)
);

CREATE INDEX IF NOT EXISTS idx_jmdict_raw_ent_seq ON jmdict_raw_entries(ent_seq);
CREATE INDEX IF NOT EXISTS idx_jmdict_raw_keb ON jmdict_raw_entries USING gin (keb);
CREATE INDEX IF NOT EXISTS idx_jmdict_raw_reb ON jmdict_raw_entries USING gin (reb);

-- ============================================================
-- Create import tracking table
-- ============================================================
CREATE TABLE IF NOT EXISTS jmdict_import_log (
    id              BIGINT PRIMARY KEY AUTOINCREMENT,
    import_date     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    entries_total   INTEGER,
    entries_success INTEGER,
    entries_failed  INTEGER,
    duration_ms     BIGINT,
    status          VARCHAR(20) DEFAULT 'RUNNING',
    error_message   TEXT
);

-- ============================================================
-- Create function to search JMdict
-- ============================================================
CREATE OR REPLACE FUNCTION search_jmdict(
    p_query TEXT,
    p_language TEXT DEFAULT 'en',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    entry_id UUID,
    surface TEXT,
    reading TEXT,
    romaji TEXT,
    jmdict_seq BIGINT,
    meanings TEXT,
    pos TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.surface,
        de.reading,
        de.romaji,
        de.jmdict_seq,
        STRING_AGG(dm.meaning, ' | ' ORDER BY dm.sort_order) AS meanings,
        de.part_of_speech AS pos
    FROM dictionary_entries de
    LEFT JOIN dictionary_meanings dm ON dm.entry_id = de.id AND dm.language = p_language
    WHERE
        de.surface ILIKE '%' || p_query || '%'
        OR de.reading ILIKE '%' || p_query || '%'
        OR de.lemma ILIKE '%' || p_query || '%'
        OR de.romaji ILIKE '%' || p_query || '%'
    GROUP BY de.id, de.surface, de.reading, de.romaji, de.jmdict_seq, de.part_of_speech
    ORDER BY
        CASE
            WHEN de.surface = p_query THEN 1
            WHEN de.surface ILIKE p_query || '%' THEN 2
            WHEN de.reading = p_query THEN 3
            WHEN de.reading ILIKE p_query || '%' THEN 4
            ELSE 5
        END,
        de.jmdict_seq NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Create autocomplete function
-- ============================================================
CREATE OR REPLACE FUNCTION autocomplete_jmdict(
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    entry_id UUID,
    surface TEXT,
    reading TEXT,
    jmdict_pri VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.surface,
        de.reading,
        de.jmdict_pri
    FROM dictionary_entries de
    WHERE
        de.surface ILIKE p_query || '%'
        OR de.reading ILIKE p_query || '%'
        OR de.romaji ILIKE p_query || '%'
    ORDER BY
        CASE
            WHEN de.surface = p_query THEN 1
            WHEN de.surface ILIKE p_query || '%' THEN 2
            WHEN de.reading = p_query THEN 3
            WHEN de.reading ILIKE p_query || '%' THEN 4
            ELSE 5
        END,
        de.jmdict_pri NULLS LAST,
        de.surface
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'V30__extend_jmdict_schema: JMdict extended schema created successfully!';
END $$;
