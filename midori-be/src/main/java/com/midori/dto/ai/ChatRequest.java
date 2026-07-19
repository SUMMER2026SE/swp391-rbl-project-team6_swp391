package com.midori.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ChatRequest {

    private UUID conversationId;

    @NotBlank(message = "Message is required")
    @Size(max = 4000, message = "Message must be at most 4000 characters")
    private String message;

    @Valid
    private MaterialInfo selectedMaterial;

    @Data
    public static class MaterialInfo {
        private String id;

        @Size(max = 255, message = "Material title must be at most 255 characters")
        private String title;

        private String type;
        private String level;

        @Size(max = 12000, message = "Material content must be at most 12000 characters")
        private String content;
    }
}
