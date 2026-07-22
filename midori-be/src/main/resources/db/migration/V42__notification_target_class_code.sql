-- V42: Switch notification target from class UUID to class_code string.
--
-- The admin UI for notifications used to ask the admin to type a class UUID
-- even though every other surface in the product exposes a human-friendly
-- `class_code` (e.g. "N5-A1"). This migration renames the existing
-- `target_class_id` UUID column to `target_class_code` (varchar 50) so the
-- value stored is the same value the admin typed and the same value used to
-- resolve the class at send-time.
--
-- Existing rows store a UUID string. They remain valid: the service resolver
-- treats UUID-shaped values as a fallback for `findById`, so legacy rows keep
-- resolving. New rows will store the human-friendly class code.

ALTER TABLE notifications RENAME COLUMN target_class_id TO target_class_code;

-- The renamed column no longer carries UUID semantics; widen it from UUID to
-- VARCHAR(50) so any class_code format the admins pick fits. Postgres does
-- not implicitly cast UUID to VARCHAR, so we go through TEXT to avoid the
-- "cannot cast type uuid to character varying" error on existing rows.
ALTER TABLE notifications
    ALTER COLUMN target_class_code TYPE VARCHAR(50) USING target_class_code::TEXT;

COMMENT ON COLUMN notifications.target_class_code IS
    'Class code (e.g. "N5-A1") for SPECIFIC_CLASS notifications; UUID fallback supported for legacy rows.';
