-- ============================================================
-- Grammar Schema Migration
-- Creates grammars table for Teacher Grammar feature
-- ============================================================

CREATE TABLE grammars (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by      UUID            REFERENCES users(id) ON DELETE SET NULL,
    title           VARCHAR(255)    NOT NULL,
    pattern         TEXT,
    meaning         TEXT,
    structure       TEXT,
    usage           TEXT,
    examples        TEXT,
    level           VARCHAR(10),
    status          VARCHAR(20)     NOT NULL    DEFAULT 'DRAFT',
    reject_reason   VARCHAR(1000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE grammars IS 'Ngữ pháp do Teacher/Admin tạo, có quy trình duyệt DRAFT -> PENDING -> APPROVED/REJECTED';
COMMENT ON COLUMN grammars.level IS 'JLPT level: N5, N4, N3, N2, N1';
COMMENT ON COLUMN grammars.status IS 'Trạng thái: DRAFT, PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN grammars.reject_reason IS 'Lý do bị từ chối, set khi admin reject';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_grammars_level       ON grammars(level);
CREATE INDEX idx_grammars_status      ON grammars(status);
CREATE INDEX idx_grammars_created_by ON grammars(created_by);
CREATE INDEX idx_grammars_status_level ON grammars(status, level);
