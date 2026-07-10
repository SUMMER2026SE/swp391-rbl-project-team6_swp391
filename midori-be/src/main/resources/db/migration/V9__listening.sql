-- ============================================================
-- V9__listening.sql
-- BE-09a - Listening Backend Phase 1 Core
-- PostgreSQL / Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Listening Lessons
-- ============================================================

CREATE TABLE IF NOT EXISTS listening_lessons (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

level VARCHAR(10) NOT NULL,
teacher_id UUID NOT NULL,

title VARCHAR(255) NOT NULL,

audio_url VARCHAR(500),
audio_file_name VARCHAR(255),
audio_type VARCHAR(50),

answer_key TEXT,
transcript TEXT,
topic VARCHAR(100),

status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

approved_by UUID,
approved_at TIMESTAMP WITH TIME ZONE,

created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_listening_teacher
    FOREIGN KEY (teacher_id)
    REFERENCES users(id),

CONSTRAINT fk_listening_approved_by
    FOREIGN KEY (approved_by)
    REFERENCES users(id)

);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_listening_lessons_level
ON listening_lessons(level);

CREATE INDEX IF NOT EXISTS idx_listening_lessons_teacher_id
ON listening_lessons(teacher_id);

CREATE INDEX IF NOT EXISTS idx_listening_lessons_status
ON listening_lessons(status);

CREATE INDEX IF NOT EXISTS idx_listening_lessons_topic
ON listening_lessons(topic);
