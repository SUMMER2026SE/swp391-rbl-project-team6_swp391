package com.midori.common;

/**
 * Centralized constants for notification statuses.
 * All notification status references should use these constants to avoid hardcoding.
 */
public final class NotificationStatusConstants {

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_PUBLISHED = "PUBLISHED";
    public static final String STATUS_SCHEDULED = "SCHEDULED";

    private NotificationStatusConstants() {
    }
}
