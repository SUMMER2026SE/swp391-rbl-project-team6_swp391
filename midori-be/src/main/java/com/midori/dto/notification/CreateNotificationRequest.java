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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be less than 255 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(max = 4000, message = "Content must be less than 4000 characters")
    private String content;

    @NotNull(message = "Type is required")
    @Pattern(regexp = "LESSON|CONTEXT|EXAM|APPROVED|SYSTEM",
            message = "Invalid notification type")
    private String type;

    private Instant scheduledAt;

    /**
     * UI-level audience label: ALL | TEACHERS | STUDENTS | SPECIFIC_CLASS.
     * Stored on the notification record for display in the admin list.
     * When the admin triggers the actual send, this value is translated
     * into a backend-level targetType (ALL/ROLE/CLASS) in SendNotificationRequest.
     */
    private String targetType;

    private String targetRole;

    /**
     * Optional class identifier used when {@link #targetType} is
     * {@code SPECIFIC_CLASS}. Accepts either a {@code classCode} (e.g.
     * "N5-A1") or a class UUID as a string; the service resolves it via
     * {@code ClassRepository.findByClassCode} (falling back to
     * {@code findById} when a UUID-shaped value is supplied) so admins do
     * not need to know the underlying UUID.
     */
    private String classCode;
}
