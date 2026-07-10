-- ============================================================
-- Migration: V21__ai_shadowing_usage_logs.sql
-- ============================================================
-- Scope: AI conversation/messaging tables (already merged by team)
-- plus the shadowing-specific usage telemetry tables used by the
-- ShadowingService pipeline.
--
-- ai_conversations / ai_messages were merged earlier on team branch
-- (originally V15 on that branch) and must remain available here for
-- environments that never received V15. Statements use IF NOT EXISTS
-- so re-running on top of an already-migrated schema is a no-op.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- ------------------------------------------------------------
-- Shadowing-specific usage telemetry
-- ------------------------------------------------------------
-- Per-video pipeline runs (audio extraction, Whisper, Gemini, DB save)
-- so admins can audit which videos took how long and on which model.
-- Kept distinct from ai_usage_logs (V23) which tracks generic AI token
-- usage across all features.
-- ============================================================

CREATE TABLE IF NOT EXISTS shadowing_usage_logs (
    id UUID PRIMARY KEY,
    video_id VARCHAR(64) NOT NULL,
    user_id UUID REFERENCES users(id),
    whisper_model VARCHAR(100) NOT NULL,
    gemini_model VARCHAR(100) NOT NULL,
    video_duration_seconds BIGINT NOT NULL,
    video_size_bytes BIGINT,
    audio_extraction_ms BIGINT NOT NULL,
    whisper_ms BIGINT NOT NULL,
    translation_ms BIGINT NOT NULL,
    db_save_ms BIGINT NOT NULL,
    upload_local_ms BIGINT,
    upload_supabase_ms BIGINT,
    supabase_upload_success BOOLEAN NOT NULL DEFAULT FALSE,
    segment_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shadowing_usage_logs_video_id
    ON shadowing_usage_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_shadowing_usage_logs_user_id
    ON shadowing_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_shadowing_usage_logs_created_at
    ON shadowing_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_shadowing_usage_logs_status
    ON shadowing_usage_logs(status);
