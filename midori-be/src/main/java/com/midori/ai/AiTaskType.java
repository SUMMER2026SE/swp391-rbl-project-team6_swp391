package com.midori.ai;

/**
 * Configurable AI task types used to select the best Gemini model.
 *
 * <p>New task types can be added here without changing model-selection logic,
 * provided a corresponding entry exists in {@code ai.gemini.task-model-mapping}
 * and optional fallbacks in {@code ai.gemini.task-model-fallbacks}.
 */
public enum AiTaskType {
    /** Optical character recognition from images. */
    OCR,
    /** Long-form document parsing, analysis, or summarization. */
    LONG_DOCUMENT_ANALYSIS,
    /** Complex reasoning, planning, or deep analysis tasks. */
    COMPLEX_REASONING,
    /** Fallback when no specific task type matches. */
    DEFAULT
}
