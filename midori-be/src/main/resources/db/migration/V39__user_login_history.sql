-- ============================================================
-- User Login History Schema Migration
-- Tracks user login events for streak calculations
-- ============================================================

CREATE TABLE user_login_history (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_date      DATE            NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500)
);

COMMENT ON TABLE user_login_history IS 'Tracks user login events for learning streak calculations';

-- Indexes for efficient queries
CREATE INDEX idx_login_history_user_id ON user_login_history(user_id);
CREATE INDEX idx_login_history_login_date ON user_login_history(login_date);

-- Prevent duplicate login entries for the same user on the same date
CREATE UNIQUE INDEX idx_login_history_user_date ON user_login_history(user_id, login_date);
