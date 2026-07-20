package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight metadata for the AI Sensei material selector list.
 * Does NOT include full lesson content.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMaterialSummaryResponse {

    /**
     * Material type discriminator. One of VOCABULARY, GRAMMAR, READING, LISTENING.
     */
    private String type;

    /**
     * The lesson UUID. Validated against the type in the service layer.
     */
    private UUID id;

    private String title;

    /**
     * JLPT level, e.g. N5, N4.
     */
    private String level;

    private Integer lessonNumber;

    /**
     * Short preview / description shown in the selector UI.
     */
    private String shortDescription;

    private Instant updatedAt;
}
