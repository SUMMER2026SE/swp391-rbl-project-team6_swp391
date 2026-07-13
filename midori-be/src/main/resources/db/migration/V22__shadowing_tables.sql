-- ============================================================
-- V22__shadowing_tables.sql
-- Shadowing Module Database Tables
-- PostgreSQL / Supabase
-- ============================================================

-- ============================================================
-- Shadowing Videos Table
-- ============================================================
CREATE TABLE IF NOT EXISTS shadowing_videos (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    title                   VARCHAR(255)        NOT NULL,
    description             TEXT,
    video_url              TEXT,
    storage_path           VARCHAR(500),
    thumbnail_url          TEXT,
    duration               INTEGER,
    status                 VARCHAR(50)         NOT NULL DEFAULT 'PENDING',
    created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE shadowing_videos IS 'Video lessons for shadowing practice';
COMMENT ON COLUMN shadowing_videos.video_url IS 'Direct URL to video file';
COMMENT ON COLUMN shadowing_videos.storage_path IS 'Storage path in Supabase';
COMMENT ON COLUMN shadowing_videos.thumbnail_url IS 'Video thumbnail image URL';
COMMENT ON COLUMN shadowing_videos.duration IS 'Video duration in seconds';
COMMENT ON COLUMN shadowing_videos.status IS 'Processing status: PENDING, PROCESSING, READY, FAILED';

-- ============================================================
-- Shadowing Transcripts Table
-- ============================================================
CREATE TABLE IF NOT EXISTS shadowing_transcripts (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id            UUID                NOT NULL,
    sentence_order      INTEGER             NOT NULL,
    start_time          INTEGER             NOT NULL,
    end_time            INTEGER             NOT NULL,
    jp_text             TEXT                NOT NULL,
    vn_text             TEXT,

    CONSTRAINT fk_shadowing_transcript_video
        FOREIGN KEY (video_id)
        REFERENCES shadowing_videos(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE shadowing_transcripts IS 'Transcript segments for shadowing videos';
COMMENT ON COLUMN shadowing_transcripts.start_time IS 'Start time in seconds';
COMMENT ON COLUMN shadowing_transcripts.end_time IS 'End time in seconds';
COMMENT ON COLUMN shadowing_transcripts.jp_text IS 'Japanese text of the segment';
COMMENT ON COLUMN shadowing_transcripts.vn_text IS 'Vietnamese translation';

-- ============================================================
-- Shadowing Processing Logs Table
-- ============================================================
CREATE TABLE IF NOT EXISTS shadowing_processing_logs (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id            UUID                NOT NULL,
    step                VARCHAR(50)         NOT NULL,
    status              VARCHAR(50)         NOT NULL DEFAULT 'STARTED',
    error_message       TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_shadowing_processing_video
        FOREIGN KEY (video_id)
        REFERENCES shadowing_videos(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE shadowing_processing_logs IS 'Processing logs for shadowing video workflow';
COMMENT ON COLUMN shadowing_processing_logs.step IS 'Processing step: TRANSCRIBE, TRANSLATE, SEGMENT, COMPLETE';
COMMENT ON COLUMN shadowing_processing_logs.status IS 'Step status: STARTED, COMPLETED, FAILED';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_shadowing_videos_status ON shadowing_videos(status);
CREATE INDEX IF NOT EXISTS idx_shadowing_transcripts_video_id ON shadowing_transcripts(video_id);
CREATE INDEX IF NOT EXISTS idx_shadowing_transcripts_order ON shadowing_transcripts(video_id, sentence_order);
CREATE INDEX IF NOT EXISTS idx_shadowing_processing_logs_video_id ON shadowing_processing_logs(video_id);
