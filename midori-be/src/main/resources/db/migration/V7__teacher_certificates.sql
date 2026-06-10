-- ============================================================
-- Teacher Certificates Schema Migration
-- Creates teacher_certificates table for Teacher Profile certificates
-- ============================================================

CREATE TABLE teacher_certificates (
    id                  UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id          UUID                        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title               VARCHAR(255)                NOT NULL,
    issuer              VARCHAR(255)                NOT NULL,
    issued_date         DATE,
    certificate_url     TEXT,
    image_url           TEXT,
    description         TEXT,
    created_at          TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE teacher_certificates IS 'Chứng chỉ của giáo viên dùng cho Teacher Profile';
COMMENT ON COLUMN teacher_certificates.teacher_id IS 'Giáo viên sở hữu chứng chỉ';
COMMENT ON COLUMN teacher_certificates.issued_date IS 'Ngày cấp chứng chỉ';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_teacher_certificates_teacher_id ON teacher_certificates(teacher_id);
