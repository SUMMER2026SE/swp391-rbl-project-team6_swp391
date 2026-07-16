package com.midori.ai;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.exception.AiProcessingException;

import java.util.List;

/**
 * Unified AI Provider interface for all AI operations.
 *
 * <p>This interface provides a consistent contract for:
 * - Chat/Conversation
 * - Question/Quiz Generation
 * - Exam Parsing (PDF to structured questions)
 * - Translation
 *
 * <p>All business modules should use this interface through {@code AiCoreService},
 * never calling providers directly.
 */
public interface AiProvider {

    // ============================================================
    // Provider Information
    // ============================================================

    /**
     * Get the provider type (GEMINI, OPENAI, DEEPSEEK, OPENROUTER).
     */
    AiProviderType getType();

    /**
     * Get a human-readable name for this provider.
     */
    String getName();

    /**
     * Check if this provider is configured with valid credentials.
     */
    boolean isConfigured();

    // ============================================================
    // Chat/Conversation
    // ============================================================

    /**
     * Send a chat message to the LLM.
     *
     * @param systemPrompt the system prompt
     * @param userMessage the user message
     * @param conversationHistory list of previous messages as [role, content] pairs
     * @return the LLM response text
     */
    String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory);

    /**
     * Send a chat message to the LLM with an explicit task type hint.
     *
     * <p>The default implementation delegates to {@link #chat(String, String, List)}.
     */
    default String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory, AiTaskType taskType) {
        return chat(systemPrompt, userMessage, conversationHistory);
    }

    // ============================================================
    // Question Generation
    // ============================================================

    /**
     * Generate questions from material content.
     *
     * @param materialTitle the material title
     * @param materialContent the material content
     * @param questionCount number of questions
     * @param questionType question type (MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE, MIXED)
     * @param difficulty difficulty level (EASY, MEDIUM, HARD)
     * @return JSON string containing questions
     */
    String generateQuestions(String materialTitle, String materialContent,
                            int questionCount, String questionType, String difficulty);

    /**
     * Generate questions from material content with an explicit task type hint.
     *
     * <p>The default implementation delegates to {@link #generateQuestions(String, String, int, String, String)}.
     */
    default String generateQuestions(String materialTitle, String materialContent,
                                     int questionCount, String questionType, String difficulty, AiTaskType taskType) {
        return generateQuestions(materialTitle, materialContent, questionCount, questionType, difficulty);
    }

    // ============================================================
    // Exam Parsing (PDF to structured questions)
    // ============================================================

    /**
     * Parse exam questions from extracted PDF text.
     *
     * @param extractedText the extracted text from PDF
     * @param filename the original filename
     * @return structured exam data
     */
    AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException;

    /**
     * Parse exam questions from extracted PDF text with an explicit task type hint.
     *
     * <p>The default implementation delegates to {@link #parseExamFromText(String, String)}.
     */
    default AiExamParseResponse parseExamFromText(String extractedText, String filename, AiTaskType taskType) throws AiParsingException {
        return parseExamFromText(extractedText, filename);
    }

    // ============================================================
    // Utilities
    // ============================================================

    /**
     * Get the last model that successfully responded.
     * Returns null if no successful call has been made yet.
     */
    String getLastModelUsed();

    /**
     * Get the list of models configured for this provider.
     */
    List<String> getModels();
}
