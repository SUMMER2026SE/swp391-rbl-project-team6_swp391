package com.midori.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

/**
 * Request DTO for AI-powered exam generation from lesson content.
 * Teacher selects a lesson, skills, difficulty, and question count,
 * then AI generates a preview before the teacher saves.
 */
@Data
public class AiExamGenerateRequest {

    @NotBlank(message = "JLPT Level is required")
    private String level;

    @NotNull(message = "Lesson ID is required")
    private Integer lessonId;

    @NotEmpty(message = "At least one skill must be selected")
    private List<String> skills;

    @NotBlank(message = "Difficulty is required")
    private String difficulty;

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Question count must be at least 1")
    @Max(value = 50, message = "Question count cannot exceed 50")
    private Integer questionCount;

    /**
     * Writing mode for WRITING skill.
     * When WRITING is the only selected skill, one of:
     * MIXED_WRITING, JA_TO_VI_TRANSLATION, VI_TO_JA_TRANSLATION, SENTENCE_REORDER.
     * Null or absent means MIXED_WRITING (backward-compatible default).
     */
    private String writingMode;

    /**
     * Question type/format to generate.
     * When non-WRITING skills are selected, one of:
     * MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK, SHORT_ANSWER,
     * MATCHING, TRANSLATION, SENTENCE_WRITING, ERROR_CORRECTION.
     * Null means MULTIPLE_CHOICE (backward-compatible default for non-writing skills).
     */
    private String questionFormat;
}
