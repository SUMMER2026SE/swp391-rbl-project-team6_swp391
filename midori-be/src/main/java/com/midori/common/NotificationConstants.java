package com.midori.common;

/**
 * Centralized constants for notification types.
 * All notification type references should use these constants to avoid hardcoding.
 */
public final class NotificationConstants {

    public static final String TYPE_LESSON = "LESSON";
    public static final String TYPE_CONTENT_APPROVED = "CONTENT_APPROVED";
    public static final String TYPE_CONTENT_REJECTED = "CONTENT_REJECTED";
    public static final String TYPE_TEACHER_APPROVED = "TEACHER_APPROVED";
    public static final String TYPE_TEACHER_REJECTED = "TEACHER_REJECTED";
    public static final String TYPE_SYSTEM = "SYSTEM";

    public static final String[] ALL_TYPES = {
            TYPE_LESSON,
            TYPE_CONTENT_APPROVED,
            TYPE_CONTENT_REJECTED,
            TYPE_TEACHER_APPROVED,
            TYPE_TEACHER_REJECTED,
            TYPE_SYSTEM
    };

    private NotificationConstants() {
    }
}
