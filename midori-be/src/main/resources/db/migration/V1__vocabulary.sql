-- ============================================================
-- Vocabulary Schema Migration
-- Ticket: DB-02
-- Creates vocabulary_lessons and vocabulary_words tables
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Bảng 1: vocabulary_lessons
CREATE TABLE vocabulary_lessons (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    level           VARCHAR(10),
    topic           VARCHAR(100),
    estimated_minutes INTEGER,
    word_count      INTEGER         NOT NULL    DEFAULT 0,
    is_published    BOOLEAN         NOT NULL    DEFAULT FALSE,
    created_by      UUID            REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vocabulary_lessons IS 'Bài học từ vựng, do Teacher/Admin tạo';
COMMENT ON COLUMN vocabulary_lessons.level IS 'JLPT level: N5, N4, N3, N2, N1';
COMMENT ON COLUMN vocabulary_lessons.word_count IS 'Số từ trong bài; do service quản lý, mặc định 0';

-- Bảng 2: vocabulary_words
CREATE TABLE vocabulary_words (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id           UUID            NOT NULL REFERENCES vocabulary_lessons(id)
                                            ON DELETE CASCADE,
    word                VARCHAR(255)    NOT NULL,
    furigana            VARCHAR(255),
    romaji              VARCHAR(255),
    meaning             VARCHAR(500)    NOT NULL,
    example_japanese    TEXT,
    example_meaning     TEXT,
    audio_url           VARCHAR(500),
    display_order       INTEGER         NOT NULL    DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vocabulary_words IS 'Từ vựng thuộc một bài học vocabulary_lessons';
COMMENT ON COLUMN vocabulary_words.furigana IS 'Phiên âm hiragana/katakana của từ tiếng Nhật';
COMMENT ON COLUMN vocabulary_words.romaji IS 'Cách đọc romaji của từ tiếng Nhật';
COMMENT ON COLUMN vocabulary_words.display_order IS 'Thứ tự hiển thị từ trong bài học';

-- ============================================================
-- Indexes
-- ============================================================

-- Index cho vocabulary_lessons
CREATE INDEX idx_vocabulary_lessons_level      ON vocabulary_lessons(level);
CREATE INDEX idx_vocabulary_lessons_topic     ON vocabulary_lessons(topic);
CREATE INDEX idx_vocabulary_lessons_is_published ON vocabulary_lessons(is_published);
CREATE INDEX idx_vocabulary_lessons_created_by  ON vocabulary_lessons(created_by);

-- Index cho vocabulary_words
CREATE INDEX idx_vocabulary_words_lesson_id          ON vocabulary_words(lesson_id);
CREATE INDEX idx_vocabulary_words_lesson_order       ON vocabulary_words(lesson_id, display_order);

-- ============================================================
-- Update word_count trigger (optional safety net)
-- Keeps word_count in sync whenever words are inserted/updated/deleted
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_vocabulary_word_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE vocabulary_lessons
        SET word_count = (
            SELECT COUNT(*)::INTEGER FROM vocabulary_words WHERE lesson_id = NEW.lesson_id
        )
        WHERE id = NEW.lesson_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE vocabulary_lessons
        SET word_count = (
            SELECT COUNT(*)::INTEGER FROM vocabulary_words WHERE lesson_id = NEW.lesson_id
        )
        WHERE id = NEW.lesson_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE vocabulary_lessons
        SET word_count = (
            SELECT COUNT(*)::INTEGER FROM vocabulary_words WHERE lesson_id = OLD.lesson_id
        )
        WHERE id = OLD.lesson_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vocabulary_word_count
    AFTER INSERT OR UPDATE OR DELETE ON vocabulary_words
    FOR EACH ROW EXECUTE FUNCTION fn_update_vocabulary_word_count();
