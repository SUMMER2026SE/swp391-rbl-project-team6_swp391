-- ============================================================
-- Notifications Enhancement Migration
-- Adds scheduling and targeting columns to notifications table
-- ============================================================

-- Convert target_class_id from BIGINT to UUID to match classes.id
-- Drop existing data and column, then re-add as UUID
ALTER TABLE notifications
    DROP COLUMN IF EXISTS target_class_id;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS target_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS target_class_id UUID;

COMMENT ON COLUMN notifications.scheduled_at IS 'Scheduled time to send the notification';
COMMENT ON COLUMN notifications.target_type IS 'Target audience type: ALL, ROLE, CLASS';
COMMENT ON COLUMN notifications.target_role IS 'Target role: TEACHER, STUDENT';
COMMENT ON COLUMN notifications.target_class_id IS 'Target class ID (UUID) for class-specific notifications';

-- ============================================================
-- Indexes for new columns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_target_class_id ON notifications(target_class_id);
