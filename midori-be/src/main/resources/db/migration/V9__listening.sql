-- ============================================================
-- V9__listening.sql
-- BE-09a - Listening Backend Phase 1 Core
-- PostgreSQL / Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Levels
-- ============================================================

CREATE TABLE IF NOT EXISTS levels (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO levels (name)
VALUES
('N5'),
('N4'),
('N3'),
('N2'),
('N1')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Listening Lessons
-- ============================================================

CREATE TABLE IF NOT EXISTS listening_lessons (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

level_id UUID NOT NULL,
teacher_id UUID NOT NULL,

title VARCHAR(255) NOT NULL,

audio_url VARCHAR(500),
audio_file_name VARCHAR(255),
audio_type VARCHAR(50),

answer_key TEXT,
transcript TEXT,

status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

approved_by UUID,
approved_at TIMESTAMP WITH TIME ZONE,

created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_listening_level
    FOREIGN KEY (level_id)
    REFERENCES levels(id),

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

CREATE INDEX IF NOT EXISTS idx_listening_lessons_level_id
ON listening_lessons(level_id);

CREATE INDEX IF NOT EXISTS idx_listening_lessons_teacher_id
ON listening_lessons(teacher_id);

CREATE INDEX IF NOT EXISTS idx_listening_lessons_status
ON listening_lessons(status);
