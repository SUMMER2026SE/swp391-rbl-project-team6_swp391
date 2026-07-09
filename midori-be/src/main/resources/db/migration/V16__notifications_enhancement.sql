-- ============================================================
-- Notifications Enhancement Migration
-- Adds scheduling and targeting columns to the notifications table.
--
-- This migration is idempotent and safe to run against:
--   1. A fresh database (no target_class_id column yet): the
--      ADD COLUMN IF NOT EXISTS statements create the columns.
--   2. A database that already ran the previous V16a/V16b pair
--      (target_class_id already exists as UUID): all
--      ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
--      statements are no-ops. No DROP COLUMN is issued, so any
--      existing data is preserved.
--
-- Notes:
--   * target_class_id is created as UUID directly to match
--     classes.id (UUID). No DROP + re-create is performed.
--   * target_type / target_role / scheduled_at are added in the
--     same ALTER TABLE to keep the migration atomic.
-- ============================================================

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS scheduled_at    TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS target_type     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS target_role     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS target_class_id UUID;

COMMENT ON COLUMN notifications.scheduled_at    IS 'Scheduled time to send the notification';
COMMENT ON COLUMN notifications.target_type     IS 'Target audience type: ALL, ROLE, CLASS';
COMMENT ON COLUMN notifications.target_role     IS 'Target role: TEACHER, STUDENT';
COMMENT ON COLUMN notifications.target_class_id IS 'Target class ID (UUID) for class-specific notifications';

-- ============================================================
-- Indexes for new columns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at     ON notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_target_type      ON notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role      ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_target_class_id  ON notifications(target_class_id);