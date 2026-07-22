package com.midori.dto.notification;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {

    @NotBlank(message = "Target type is required")
    private String targetType;

    private String role;

    /**
     * Class identifier for {@code targetType == "CLASS"}. Accepts either a
     * human-friendly {@code classCode} (e.g. "N5-A1") or a UUID; the service
     * resolves it through {@code ClassRepository.findByClassCode} (with a
     * UUID-shaped fallback) so admins no longer need to type a UUID.
     */
    private String classCode;
}
