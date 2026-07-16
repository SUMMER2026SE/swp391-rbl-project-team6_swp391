package com.midori.dto.response;

import com.midori.entity.Role;
import com.midori.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTeacherResponse {

    private UUID id;
    private String email;
    private Role role;
    private UserStatus status;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String phone;
    private String location;
    private LocalDate dateOfBirth;
    private String rejectionReason;
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Number of classes this teacher owns. Populated by the admin service when
     * the response is rendered for the Teacher Management list. Null when the
     * caller doesn't request per-teacher aggregates (e.g. {@code /pending}).
     */
    private Long totalClasses;

    /**
     * Total distinct students enrolled in any class owned by this teacher.
     * Populated alongside {@link #totalClasses}.
     */
    private Long totalStudents;
}
