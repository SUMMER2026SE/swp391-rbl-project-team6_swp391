-- Daily Streak fields
-- V27__add_daily_streak.sql

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_date DATE;
