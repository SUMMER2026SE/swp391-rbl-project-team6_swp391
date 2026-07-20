-- ============================================================
-- V25__add_dictionary_search_indexes.sql
-- Add search indexes on romaji and meaning for fast search and autocomplete
-- PostgreSQL / Supabase
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dictionary_entries_romaji ON dictionary_entries(romaji);
CREATE INDEX IF NOT EXISTS idx_dictionary_meanings_meaning ON dictionary_meanings(meaning);
