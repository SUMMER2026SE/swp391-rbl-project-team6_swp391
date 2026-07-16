package com.midori.dto.response;

import com.midori.entity.Role;
import com.midori.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID id;
    private String email;
    private Role role;
    private UserStatus status;
    private String rejectionReason;
    private Boolean emailVerified;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer currentStreak;
}
