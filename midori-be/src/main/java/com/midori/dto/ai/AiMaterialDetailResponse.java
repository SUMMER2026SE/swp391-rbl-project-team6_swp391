package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * AI Sensei material detail response.
 *
 * <p>Returns lesson metadata plus a single formatted {@code content} string
 * that the AI Sensei chat / quiz generator can inject into the LLM prompt.
 * The formatted content is the only material payload sent to the model;
 * it is built and capped server-side (see {@code AiMaterialService}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMaterialDetailResponse {

    /**
     * Material type discriminator. One of VOCABULARY, GRAMMAR, READING, LISTENING.
     */
    private String type;

    private UUID id;

    private String title;

    private String level;

    private Integer lessonNumber;

    /**
     * Pre-formatted plain-text content ready for the LLM prompt.
     * Always capped to the project's material size limit (12000 chars).
     * If the formatted source content exceeded the limit, {@code truncated}
     * will be true.
     */
    private String content;

    /**
     * True if the formatted content was truncated to fit the size limit.
     */
    private boolean truncated;
}
