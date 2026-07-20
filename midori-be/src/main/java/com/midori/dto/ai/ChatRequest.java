package com.midori.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
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

    /**
     * Material reference for the AI Sensei chat context.
     *
     * <p><strong>Trust model:</strong> when both {@code id} and {@code type}
     * are present, the backend resolves the material through
     * {@code AiMaterialService} and ignores any client-supplied
     * {@code title}/{@code content}. When neither is present, the request is
     * treated as free-text (no material context).
     *
     * <p>Partial references — only id, or only type — are explicitly rejected
     * via {@link #isValidMaterialReference()}. This prevents attackers from
     * injecting fake lesson content via the body while bypassing the
     * resolver.
     *
     * <p>Backward compatibility: when only {@code title}/{@code content} are
     * provided (legacy mock format), the chat falls back to a no-material
     * Japanese-tutoring conversation. Such legacy payloads cannot influence
     * database-backed material answers because they cannot resolve to a real
     * lesson id.
     */
    @Data
    public static class MaterialInfo {

        /**
         * Lesson UUID. Required when {@link #type} is present.
         */
        private UUID id;

        /**
         * Material type discriminator (VOCABULARY | GRAMMAR | READING | LISTENING).
         * Required when {@link #id} is present.
         */
        private String type;

        @Size(max = 255, message = "Material title must be at most 255 characters")
        private String title;

        /**
         * Legacy / display-only field. NOT trusted as authoritative lesson content
         * when a database reference (id+type) is supplied.
         */
        @Size(max = 12000, message = "Material content must be at most 12000 characters")
        private String content;

        private String level;

        /**
         * Cross-field rule:
         * <ul>
         *   <li>Both id and type present → OK (trusted path)</li>
         *   <li>Neither present → OK (free-text path)</li>
         *   <li>Only id or only type → invalid</li>
         * </ul>
         */
        @AssertTrue(message = "Material reference must include both 'id' and 'type', or neither. Partial references are rejected.")
        public boolean isValidMaterialReference() {
            boolean hasId = id != null;
            boolean hasType = type != null && !type.isBlank();
            return (hasId && hasType) || (!hasId && !hasType);
        }

        /**
         * True iff this payload points to a real database material.
         */
        public boolean hasDatabaseReference() {
            return id != null && type != null && !type.isBlank();
        }
    }
}
