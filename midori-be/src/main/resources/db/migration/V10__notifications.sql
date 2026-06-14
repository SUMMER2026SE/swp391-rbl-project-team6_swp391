-- ============================================================
-- Notifications Schema Migration
-- Creates notifications and user_notifications tables
-- ============================================================

CREATE TABLE notifications (
    id              BIGSERIAL                   PRIMARY KEY,
    title           VARCHAR(255)                NOT NULL,
    content         TEXT,
    type            VARCHAR(50)                NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'System notifications for user alerts';
COMMENT ON COLUMN notifications.type IS 'Notification type: LESSON, APPROVAL, REJECTION, SYSTEM, etc.';

CREATE TABLE user_notifications (
    id                  BIGSERIAL                PRIMARY KEY,
    user_id             UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id      BIGINT                  NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    is_read             BOOLEAN                 NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_notifications IS 'Links users to their notifications';
COMMENT ON COLUMN user_notifications.is_read IS 'Whether the user has read this notification';
COMMENT ON COLUMN user_notifications.read_at IS 'Timestamp when the user read the notification';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_user_id_is_read ON user_notifications(user_id, is_read);
