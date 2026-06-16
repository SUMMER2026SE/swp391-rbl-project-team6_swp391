-- ============================================================
-- Grammar Pending Update Migration
-- Adds pending update fields for teacher editing APPROVED grammar
-- Without overwriting current approved content for students
-- ============================================================

ALTER TABLE grammars ADD COLUMN has_pending_update BOOLEAN DEFAULT FALSE;
ALTER TABLE grammars ADD COLUMN pending_title VARCHAR(255);
ALTER TABLE grammars ADD COLUMN pending_pattern TEXT;
ALTER TABLE grammars ADD COLUMN pending_meaning TEXT;
ALTER TABLE grammars ADD COLUMN pending_structure TEXT;
ALTER TABLE grammars ADD COLUMN pending_usage TEXT;
ALTER TABLE grammars ADD COLUMN pending_examples TEXT;
ALTER TABLE grammars ADD COLUMN pending_example_meanings TEXT;
ALTER TABLE grammars ADD COLUMN pending_level VARCHAR(10);
ALTER TABLE grammars ADD COLUMN pending_update_reject_reason VARCHAR(1000);

COMMENT ON TABLE grammars IS 'Ngữ pháp do Teacher/Admin tạo, có quy trình duyệt DRAFT -> PENDING -> APPROVED/REJECTED';
COMMENT ON COLUMN grammars.has_pending_update IS 'True khi teacher đã edit bài APPROVED và đang chờ admin duyệt';
COMMENT ON COLUMN grammars.pending_title IS 'Nội dung mới của teacher khi edit bài đã APPROVED';
COMMENT ON COLUMN grammars.pending_pattern IS 'Pattern mới chờ duyệt';
COMMENT ON COLUMN grammars.pending_meaning IS 'Nghĩa mới chờ duyệt';
COMMENT ON COLUMN grammars.pending_structure IS 'Cấu trúc mới chờ duyệt';
COMMENT ON COLUMN grammars.pending_usage IS 'Cách dùng mới chờ duyệt';
COMMENT ON COLUMN grammars.pending_examples IS 'Ví dụ mới chờ duyệt (JSON array)';
COMMENT ON COLUMN grammars.pending_example_meanings IS 'Nghĩa ví dụ mới chờ duyệt (JSON array)';
COMMENT ON COLUMN grammars.pending_level IS 'JLPT level mới chờ duyệt';
COMMENT ON COLUMN grammars.pending_update_reject_reason IS 'Lý do admin reject pending update';

-- ============================================================
-- Indexes for pending updates
-- ============================================================

CREATE INDEX idx_grammars_has_pending_update ON grammars(has_pending_update) WHERE has_pending_update = TRUE;
