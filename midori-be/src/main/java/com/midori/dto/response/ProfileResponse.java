package com.midori.dto.response;

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
public class ProfileResponse {

    private UUID id;
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String phone;
    private String location;
    private LocalDate dateOfBirth;
    private Instant createdAt;
    private Instant updatedAt;
    private String jlptLevel;
}
