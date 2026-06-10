-- ============================================================
-- Study Progress Schema Migration
-- Creates user_learning_progress table for student progress tracking
-- ============================================================

CREATE TABLE user_learning_progress (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type        VARCHAR(20)     NOT NULL,
    content_id          UUID            NOT NULL,
    learned            BOOLEAN         NOT NULL    DEFAULT FALSE,
    mastered            BOOLEAN         NOT NULL    DEFAULT FALSE,
    favorite            BOOLEAN         NOT NULL    DEFAULT FALSE,
    completed           BOOLEAN         NOT NULL    DEFAULT FALSE,
    progress_percent    INTEGER         NOT NULL    DEFAULT 0,
    last_studied_at     TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_user_content_type_content_id UNIQUE (user_id, content_type, content_id),
    CONSTRAINT chk_progress_percent CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

COMMENT ON TABLE user_learning_progress IS 'Lưu tiến độ học tập của student cho VOCABULARY, GRAMMAR, FLASHCARD, LESSON';
COMMENT ON COLUMN user_learning_progress.content_type IS 'Loại nội dung: VOCABULARY, GRAMMAR, FLASHCARD, LESSON';
COMMENT ON COLUMN user_learning_progress.progress_percent IS 'Phần trăm hoàn thành: 0-100';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_progress_user_id          ON user_learning_progress(user_id);
CREATE INDEX idx_progress_content_type     ON user_learning_progress(content_type);
CREATE INDEX idx_progress_content_id       ON user_learning_progress(content_id);
CREATE INDEX idx_progress_user_content_type ON user_learning_progress(user_id, content_type);
CREATE INDEX idx_progress_last_studied_at  ON user_learning_progress(last_studied_at);
