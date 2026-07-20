-- ============================================================
-- V28__student_saved_words.sql
-- Student Saved Words Table for Dictionary Popup
-- ============================================================

-- Table for storing words saved by students from dictionary popup
CREATE TABLE IF NOT EXISTS student_saved_words (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             VARCHAR(100)        NOT NULL,
    surface             VARCHAR(255)        NOT NULL,
    reading             VARCHAR(255),
    dictionary_form     VARCHAR(255),
    meaning             VARCHAR(1000)       NOT NULL,
    context             TEXT,
    word_type           VARCHAR(100),
    jlpt_level          VARCHAR(10),
    lesson_id           VARCHAR(100),
    audio_url           VARCHAR(500),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uk_saved_word_user_surface UNIQUE (user_id, surface)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_words_user_surface ON student_saved_words(user_id, surface);
CREATE INDEX IF NOT EXISTS idx_saved_words_created ON student_saved_words(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_words_jlpt ON student_saved_words(user_id, jlpt_level);
CREATE INDEX IF NOT EXISTS idx_saved_words_lesson ON student_saved_words(user_id, lesson_id);

-- Comments
COMMENT ON TABLE student_saved_words IS 'Words saved by students from the dictionary popup for later review';
COMMENT ON COLUMN student_saved_words.surface IS 'Japanese surface form of the saved word';
COMMENT ON COLUMN student_saved_words.reading IS 'Kana reading of the word';
COMMENT ON COLUMN student_saved_words.dictionary_form IS 'Dictionary base form (lemma)';
COMMENT ON COLUMN student_saved_words.meaning IS 'Vietnamese meaning of the word';
COMMENT ON COLUMN student_saved_words.context IS 'Sentence context where the word was saved';
COMMENT ON COLUMN student_saved_words.word_type IS 'Part of speech (Godan Verb, Ichidan Verb, etc.)';
COMMENT ON COLUMN student_saved_words.jlpt_level IS 'JLPT level (N5, N4, N3, N2, N1)';
COMMENT ON COLUMN student_saved_words.lesson_id IS 'Related lesson or video ID if applicable';
