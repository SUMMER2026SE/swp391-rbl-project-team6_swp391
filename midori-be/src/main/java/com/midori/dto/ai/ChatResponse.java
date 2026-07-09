package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class ChatResponse {

    private UUID conversationId;
    private String reply;
    private Instant createdAt;
    private String modelUsed;
}
