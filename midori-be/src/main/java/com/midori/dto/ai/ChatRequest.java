package com.midori.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ChatRequest {

    private UUID conversationId;

    @NotBlank(message = "Message is required")
    @Size(max = 4000, message = "Message must be at most 4000 characters")
    private String message;
}
