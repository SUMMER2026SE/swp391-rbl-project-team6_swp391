package com.midori.common;

/**
 * Centralized constants for notification types. All notification type
 * references should use these constants to avoid hardcoding.
 *
 * <p>The set mirrors {@link com.midori.entity.NotificationType} exactly and
 * intentionally drops the legacy CONTENT_* / TEACHER_* values; any persisted
 * row still using one of those values is rewritten by the V41 migration.
 */
public final class NotificationConstants {

    public static final String TYPE_LESSON = "LESSON";
    public static final String TYPE_CONTEXT = "CONTEXT";
    public static final String TYPE_EXAM = "EXAM";
    public static final String TYPE_APPROVED = "APPROVED";
    public static final String TYPE_SYSTEM = "SYSTEM";

    public static final String[] ALL_TYPES = {
            TYPE_LESSON,
            TYPE_CONTEXT,
            TYPE_EXAM,
            TYPE_APPROVED,
            TYPE_SYSTEM
    };

    private NotificationConstants() {
    }
}
