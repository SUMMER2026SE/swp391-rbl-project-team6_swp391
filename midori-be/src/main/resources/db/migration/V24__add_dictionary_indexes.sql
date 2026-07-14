-- ============================================================
-- V24__add_dictionary_indexes.sql
-- Add indexes on lemma and reading columns for high performance lookup
-- PostgreSQL / Supabase
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dictionary_entries_lemma ON dictionary_entries(lemma);
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_reading ON dictionary_entries(reading);
