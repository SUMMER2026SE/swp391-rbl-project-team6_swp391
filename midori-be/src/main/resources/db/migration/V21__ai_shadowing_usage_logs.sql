-- ============================================================
-- Migration: V21__ai_shadowing_usage_logs.sql
-- ============================================================
-- Shadowing-specific usage telemetry for the ShadowingService
-- pipeline (audio extraction, Whisper, Gemini, DB save). Kept
-- distinct from ai_usage_logs (V22) which tracks generic AI token
-- usage across all features.
--
-- NOTE: ai_conversations / ai_messages live in V15__ai_conversations.sql
-- (Đạt's migration on main) and are no longer defined here. Statements
-- below are idempotent via IF NOT EXISTS so re-running on top of an
-- already-migrated schema is a no-op.
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