-- ============================================================
-- V23__ai_usage_logs.sql
-- ============================================================
-- NOTE: V22 is intentionally skipped — that version slot is
-- reserved for Ngân's in-flight migration. Do not create V22.
-- ============================================================
-- Per-feature AI usage telemetry: prompt/completion tokens,
-- latency, status. Complements the shadowing-specific table
-- in V21__ai_shadowing_usage_logs.sql which tracks per-pipeline
-- timings for the shadowing feature.
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id UUID,
    feature VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    processing_time BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_lesson_id ON ai_usage_logs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_status ON ai_usage_logs(status);