-- ============================================================
-- V26__create_transcript_tokens.sql
-- Create transcript_tokens table to cache morphological analysis results
-- PostgreSQL / Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS transcript_tokens (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    sentence_id         UUID                NOT NULL,
    surface             VARCHAR(255)        NOT NULL,
    lemma               VARCHAR(255),
    reading             VARCHAR(255),
    position            INTEGER             NOT NULL,

    CONSTRAINT fk_transcript_tokens_sentence
        FOREIGN KEY (sentence_id)
        REFERENCES shadowing_transcripts(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transcript_tokens_sentence_id ON transcript_tokens(sentence_id);
