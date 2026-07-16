package com.midori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregated statistics for the admin Teacher Management page.
 *
 * <p>Every counter is computed server-side from the database so the frontend
 * does not have to download the full teacher list to render KPI cards.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTeacherStatsResponse {

    /** Total number of teachers currently in PENDING_APPROVAL status. */
    private long pendingTeachers;

    /** Number of pending teachers whose application was created today. */
    private long pendingTeachersToday;

    /** Number of pending teachers whose application was created in the last 7 days. */
    private long pendingTeachersThisWeek;

    /** Number of pending teachers that have uploaded at least one certificate. */
    private long pendingTeachersCertified;

    /** Total number of users with role TEACHER (any status). */
    private long totalTeachers;

    /** Number of teachers currently in ACTIVE status. */
    private long activeTeachers;

    /** Total number of classes in the system. */
    private long totalClasses;

    /** Total distinct students enrolled in at least one teacher class. */
    private long totalStudents;
}