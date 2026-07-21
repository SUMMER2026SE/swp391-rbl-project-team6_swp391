package com.midori.entity;

/**
 * Canonical notification type set.
 *
 * <p>This enum is the single source of truth for every notification type stored
 * in the {@code notifications.type} column. Legacy values
 * ({@code CONTENT_APPROVED}, {@code CONTENT_REJECTED},
 * {@code TEACHER_APPROVED}, {@code TEACHER_REJECTED}) were persisted by
 * earlier code paths and are normalized to the canonical set by the V41
 * database migration.
 *
 * <p>Mapping from the legacy values:
 * <ul>
 *   <li>{@code CONTENT_APPROVED} and {@code TEACHER_APPROVED} → {@link #APPROVED}</li>
 *   <li>{@code CONTENT_REJECTED} and {@code TEACHER_REJECTED} → {@link #CONTEXT}</li>
 *   <li>{@link #LESSON} and {@link #SYSTEM} are unchanged.</li>
 * </ul>
 */
public enum NotificationType {
    LESSON,
    CONTEXT,
    EXAM,
    APPROVED,
    SYSTEM
}
