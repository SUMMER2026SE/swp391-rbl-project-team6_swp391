-- ============================================================
-- Flashcard Schema Migration
-- Creates flashcard_sets and flashcard_cards tables
-- ============================================================

CREATE TABLE flashcard_sets (
    id              UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id      UUID                        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title           VARCHAR(255)                NOT NULL,
    description     TEXT,
    level           VARCHAR(10),
    status          VARCHAR(20)                 NOT NULL    DEFAULT 'DRAFT',
    reject_reason   VARCHAR(1000),
    created_at      TIMESTAMP WITH TIME ZONE     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE     NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE flashcard_sets IS 'Bộ flashcard do Teacher/Admin tạo, có quy trình duyệt DRAFT -> PENDING -> APPROVED/REJECTED';
COMMENT ON COLUMN flashcard_sets.teacher_id IS 'Giảng viên tạo bộ flashcard';
COMMENT ON COLUMN flashcard_sets.level IS 'JLPT level: N5, N4, N3, N2, N1';
COMMENT ON COLUMN flashcard_sets.status IS 'Trạng thái: DRAFT, PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN flashcard_sets.reject_reason IS 'Lý do bị từ chối, set khi admin reject';

CREATE TABLE flashcard_cards (
    id              UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id          UUID                        NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    front_text      VARCHAR(1000)                NOT NULL,
    back_text       VARCHAR(2000)                NOT NULL,
    example         TEXT,
    hint            VARCHAR(500),
    order_index     INTEGER                      NOT NULL    DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE     NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE flashcard_cards IS 'Thẻ flashcard thuộc một bộ flashcard_set';
COMMENT ON COLUMN flashcard_cards.set_id IS 'Bộ flashcard chứa thẻ này, xóa set sẽ xóa luôn các cards';
COMMENT ON COLUMN flashcard_cards.order_index IS 'Thứ tự hiển thị thẻ trong bộ';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_flashcard_sets_teacher_id ON flashcard_sets(teacher_id);
CREATE INDEX idx_flashcard_sets_status     ON flashcard_sets(status);
CREATE INDEX idx_flashcard_sets_level      ON flashcard_sets(level);
CREATE INDEX idx_flashcard_sets_status_level ON flashcard_sets(status, level);
CREATE INDEX idx_flashcard_cards_set_id    ON flashcard_cards(set_id);
CREATE INDEX idx_flashcard_cards_order     ON flashcard_cards(set_id, order_index);
