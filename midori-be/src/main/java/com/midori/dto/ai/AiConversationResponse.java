package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class AiConversationResponse {

    private UUID id;
    private String title;
    private Instant createdAt;
    private Instant updatedAt;
}
