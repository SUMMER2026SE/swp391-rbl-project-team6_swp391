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
}
