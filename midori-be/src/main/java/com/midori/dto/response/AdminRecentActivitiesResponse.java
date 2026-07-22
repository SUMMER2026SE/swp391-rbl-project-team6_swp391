package com.midori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Aggregated recent activities for the Admin Dashboard.
 * Each entry represents a real platform event surfaced from live database tables.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRecentActivitiesResponse {

    private List<RecentActivityEntry> activities;
    private int total;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityEntry {
        /** Unique identifier for this activity entry */
        private String id;
        /** Discriminator for the kind of activity */
        private ActivityType type;
        /** Short human-readable title */
        private String title;
        /** Supporting detail line */
        private String detail;
        /** ISO-8601 timestamp */
        private Instant timestamp;
        /** Optional: who triggered this activity */
        private String actorEmail;
        /** Optional: related entity ID (class, exam, homework, etc.) */
        private String entityId;
    }

    public enum ActivityType {
        // Teacher events
        TEACHER_REGISTERED,
        TEACHER_APPROVED,
        TEACHER_REJECTED,
        // Class events
        CLASS_CREATED,
        CLASS_ARCHIVED,
        CLASS_RESTORED,
        // Legacy events (kept for compatibility)
        STUDENT_REGISTERED,
        STUDENT_ENROLLED,
        HOMEWORK_SUBMITTED,
        EXAM_COMPLETED,
        CONTENT_APPROVED,
        NOTIFICATION_SENT
    }
}
