package com.midori.dto.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class UpdateNotificationRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be less than 255 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(max = 4000, message = "Content must be less than 4000 characters")
    private String content;

    @NotNull(message = "Type is required")
    @Pattern(regexp = "ANNOUNCEMENT|LEARNING|CONTENT_REVIEW|ACCOUNT|SYSTEM",
            message = "Invalid notification type")
    private String type;

    private Instant scheduledAt;

    /**
     * UI-level audience label: ALL | TEACHERS | STUDENTS | SPECIFIC_CLASS.
     * Matches the field on CreateNotificationRequest so the same DTO shape can
     * be reused by the edit flow without duplicating validation rules.
     */
    private String targetType;

    private String targetRole;

    private UUID targetClassId;
}
