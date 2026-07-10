-- ============================================================
-- V23__pending_video_uploads.sql
-- ============================================================
-- Persists Supabase public URLs for shadowing videos so the mapping
-- survives backend restarts (previously held only in a
-- ConcurrentHashMap).
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_video_uploads (
    id UUID PRIMARY KEY,
    video_id VARCHAR(64) NOT NULL UNIQUE,
    storage_object_path VARCHAR(512) NOT NULL,
    supabase_public_url TEXT NOT NULL,
    content_type VARCHAR(100),
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_video_uploads_video_id
    ON pending_video_uploads(video_id);