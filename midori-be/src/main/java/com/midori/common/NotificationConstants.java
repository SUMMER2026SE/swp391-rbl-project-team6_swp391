package com.midori.common;

/**
 * Centralized constants for notification types.
 * All notification type references should use these constants to avoid hardcoding.
 */
public final class NotificationConstants {

    public static final String TYPE_ANNOUNCEMENT = "ANNOUNCEMENT";
    public static final String TYPE_LEARNING = "LEARNING";
    public static final String TYPE_CONTENT_REVIEW = "CONTENT_REVIEW";
    public static final String TYPE_ACCOUNT = "ACCOUNT";
    public static final String TYPE_SYSTEM = "SYSTEM";

    public static final String[] ALL_TYPES = {
            TYPE_ANNOUNCEMENT,
            TYPE_LEARNING,
            TYPE_CONTENT_REVIEW,
            TYPE_ACCOUNT,
            TYPE_SYSTEM
    };

    private NotificationConstants() {
    }
}