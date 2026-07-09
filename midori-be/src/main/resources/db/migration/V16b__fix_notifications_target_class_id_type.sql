-- ============================================================
-- Notifications target_class_id type fix
-- Hibernate ddl-auto:update previously failed to convert
-- target_class_id from BIGINT to UUID. Force the conversion
-- here using a USING clause so existing rows (if any) are cast
-- via text -> uuid. Rows that cannot parse are set to NULL.
-- ============================================================

ALTER TABLE notifications
    ALTER COLUMN target_class_id TYPE UUID
        USING NULLIF(target_class_id::text, '')::uuid;
