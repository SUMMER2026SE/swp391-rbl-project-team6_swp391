-- V41: Normalize notification type values to the canonical 5-value set.
--
-- Canonical set (single source of truth in midori-be entity/NotificationType):
--   LESSON, CONTEXT, EXAM, APPROVED, SYSTEM
--
-- Legacy values produced by older code paths and currently persisted:
--   CONTENT_APPROVED   -> APPROVED
--   CONTENT_REJECTED   -> CONTEXT
--   TEACHER_APPROVED   -> APPROVED
--   TEACHER_REJECTED   -> CONTEXT
--
-- LESSON and SYSTEM are kept verbatim; anything else is left untouched so a
-- future migration can decide what to do with truly unknown values. The CASE
-- makes the mapping explicit and idempotent: re-running the migration is a
-- no-op once every legacy row has been rewritten.

UPDATE notifications
SET type = CASE type
        WHEN 'CONTENT_APPROVED' THEN 'APPROVED'
        WHEN 'TEACHER_APPROVED' THEN 'APPROVED'
        WHEN 'CONTENT_REJECTED' THEN 'CONTEXT'
        WHEN 'TEACHER_REJECTED' THEN 'CONTEXT'
        ELSE type
    END
WHERE type IN ('CONTENT_APPROVED', 'TEACHER_APPROVED', 'CONTENT_REJECTED', 'TEACHER_REJECTED');

COMMENT ON COLUMN notifications.type IS
    'Notification type: LESSON, CONTEXT, EXAM, APPROVED, SYSTEM. Legacy CONTENT_* / TEACHER_* values are normalized by V41.';
