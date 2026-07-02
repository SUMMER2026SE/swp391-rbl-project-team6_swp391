package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class AiMessageResponse {

    private UUID id;
    private String role;
    private String content;
    private Instant createdAt;
}
