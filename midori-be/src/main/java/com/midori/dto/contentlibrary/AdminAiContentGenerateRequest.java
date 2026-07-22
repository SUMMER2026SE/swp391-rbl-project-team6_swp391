package com.midori.dto.contentlibrary;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for AI Content Generation in the Admin Content Library.
 * 
 * Supports three skill types:
 * - VOCABULARY: Generates vocabulary lessons with word items
 * - GRAMMAR: Generates grammar lessons with grammar points
 * - READING: Generates reading comprehension lessons with passages and questions
 * 
 * An optional reference document (PDF, DOCX, TXT) can be uploaded to provide
 * additional context for the AI generation. The document text is extracted
 * and included in the AI prompt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAiContentGenerateRequest {

    // ==================== SKILL TYPE ====================
    @NotBlank(message = "Skill type is required")
    private String skillType;

    // ==================== LESSON INFORMATION ====================
    @NotNull(message = "Lesson number is required")
    @Min(value = 1, message = "Lesson number must be at least 1")
    private Integer lessonNumber;

    @NotBlank(message = "Lesson title is required")
    private String lessonTitle;

    private String lessonDescription;

    // ==================== GENERATION SETTINGS ====================
    @NotBlank(message = "JLPT level is required")
    private String level;

    /**
     * Topic/Keywords for the content.
     * For VOCABULARY: e.g., "School Life", "Food and Drink"
     * For GRAMMAR: e.g., "Expressing Possibility", "Causative"
     * For READING: e.g., "Daily Life", "Travel"
     */
    @NotBlank(message = "Topic is required")
    private String topic;

    /**
     * For VOCABULARY: Number of vocabulary items to generate
     * For GRAMMAR: Number of grammar points to generate
     */
    @Min(value = 1, message = "Item count must be at least 1")
    @Max(value = 50, message = "Item count cannot exceed 50")
    private Integer itemCount;

    // ==================== READING-SPECIFIC FIELDS ====================
    /**
     * For READING: Number of passages to generate
     */
    @Min(value = 1, message = "Passage count must be at least 1")
    @Max(value = 10, message = "Passage count cannot exceed 10")
    private Integer passageCount;

    /**
     * For READING: Number of questions per passage
     */
    @Min(value = 1, message = "Questions per passage must be at least 1")
    @Max(value = 10, message = "Questions per passage cannot exceed 10")
    private Integer questionsPerPassage;

    /**
     * For READING: Difficulty level (EASY, MEDIUM, HARD)
     */
    private String difficulty;

    /**
     * For READING: Passage length (SHORT, MEDIUM, LONG)
     */
    private String passageLength;

    // ==================== ADVANCED INSTRUCTIONS ====================
    /**
     * Custom instructions for the AI to follow during generation.
     * Can include specific requirements, focus areas, or formatting preferences.
     */
    private String customInstructions;

    // ==================== GRAMMAR-SPECIFIC FIELDS ====================
    /**
     * For GRAMMAR: Specific grammar topic to focus on
     */
    private String grammarTopic;
}
