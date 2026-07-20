-- ============================================================
-- Grammar Patterns Schema Migration
-- New Hanabira-sourced grammar pattern library with lazy AI translation
-- Separate from 'grammars' table (teacher-authored content)
-- ============================================================

CREATE TABLE grammar_patterns (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern             VARCHAR(500)    NOT NULL UNIQUE,
    jlpt_level          VARCHAR(10),
    meaning_en          TEXT,
    meaning_vi          TEXT,
    description_en      TEXT,
    description_vi      TEXT,
    structure           TEXT,
    example_japanese    TEXT,
    example_english     TEXT,
    example_vietnamese  TEXT,
    note                TEXT,
    status              VARCHAR(30)     NOT NULL DEFAULT 'PENDING_TRANSLATION',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    translated_at       TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE grammar_patterns IS 'Hanabira-sourced JLPT grammar patterns. Vietnamese translation is generated lazily via Gemini AI.';
COMMENT ON COLUMN grammar_patterns.status IS 'PENDING_TRANSLATION | TRANSLATED | FAILED';
COMMENT ON COLUMN grammar_patterns.pattern IS 'Grammar pattern string, e.g. ～ています. Unique key for deduplication on re-import.';

-- ============================================================
-- Video Grammar Pattern join table (Many-to-Many)
-- One grammar pattern can belong to many videos.
-- One video can contain many grammar patterns.
-- ============================================================

CREATE TABLE video_grammar_patterns (
    video_id            UUID    NOT NULL REFERENCES shadowing_videos(id) ON DELETE CASCADE,
    grammar_pattern_id  UUID    NOT NULL REFERENCES grammar_patterns(id) ON DELETE CASCADE,
    example_sentence    TEXT,
    PRIMARY KEY (video_id, grammar_pattern_id)
);

COMMENT ON TABLE video_grammar_patterns IS 'Join table: which grammar patterns were detected in each shadowing video.';
COMMENT ON COLUMN video_grammar_patterns.example_sentence IS 'The exact transcript sentence that triggered the grammar match.';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_grammar_patterns_level  ON grammar_patterns(jlpt_level);
CREATE INDEX idx_grammar_patterns_status ON grammar_patterns(status);
CREATE INDEX idx_vgp_video_id            ON video_grammar_patterns(video_id);
CREATE INDEX idx_vgp_grammar_id          ON video_grammar_patterns(grammar_pattern_id);
