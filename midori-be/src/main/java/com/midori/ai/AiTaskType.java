package com.midori.ai;

/**
 * Configurable AI task types used to select the best Gemini model.
 *
 * <p>Each task type has associated characteristics that help the
 * {@link com.midori.ai.model.GeminiModelResolver} select the optimal model.
 *
 * <p><b>Adding a new task type:</b>
 * <ol>
 *   <li>Add a new enum entry with description</li>
 *   <li>Optionally update {@code ai.gemini.task-model-mapping} in configuration</li>
 * </ol>
 * No code changes in providers required.
 */
public enum AiTaskType {
    /** Simple, short responses. Best paired with fastest/cheapest model. */
    SIMPLE_TRANSLATION("Short text translation, simple grammar explanations"),

    /** Short answer generation, flashcards. */
    SHORT_ANSWER("Quiz answers, flashcard generation, quick explanations"),

    /** Optical character recognition from images. */
    OCR("Text extraction from images"),

    /** Long-form document parsing, analysis, or summarization. */
    LONG_DOCUMENT_ANALYSIS("Exam parsing, long text analysis, document summarization"),

    /** Complex reasoning, planning, or deep analysis tasks. */
    COMPLEX_REASONING("Deep analysis, reasoning, complex question generation"),

    /** Shadowing/speaking practice evaluation. */
    SHADOWING_EVALUATION("Japanese shadowing pronunciation evaluation"),

    /** Default/fallback for any task. */
    DEFAULT("Default task type, use balanced model");

    private final String description;

    AiTaskType(String description) {
        this.description = description;
    }

    /**
     * Get human-readable description of this task type.
     */
    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return name() + " - " + description;
    }
}
