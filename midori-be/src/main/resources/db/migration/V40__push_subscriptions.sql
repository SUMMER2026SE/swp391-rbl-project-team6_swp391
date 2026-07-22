-- V40: Push Subscriptions for Web Push Notifications
-- Stores browser push subscription endpoints and keys for each user

CREATE TABLE push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    expiration_time TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uk_push_sub_endpoint UNIQUE (endpoint)
);

-- Index for fast lookup by user_id
CREATE INDEX idx_push_sub_user_id ON push_subscriptions(user_id);

-- Index for endpoint lookups (used for deduplication)
CREATE INDEX idx_push_sub_endpoint ON push_subscriptions(endpoint);

-- Index for finding active subscriptions
CREATE INDEX idx_push_sub_active ON push_subscriptions(active) WHERE active = TRUE;

COMMENT ON TABLE push_subscriptions IS 'Web Push notification subscriptions for each user/browser combination';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push subscription endpoint URL from the browser';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'p256dh public key for encryption (base64)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Auth secret for push encryption (base64)';
