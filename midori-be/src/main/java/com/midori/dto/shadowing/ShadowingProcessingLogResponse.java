package com.midori.dto.shadowing;

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
public class ShadowingProcessingLogResponse {

    private UUID id;
    private UUID videoId;
    private String step;
    private String status;
    private String errorMessage;
    private Instant createdAt;
}
