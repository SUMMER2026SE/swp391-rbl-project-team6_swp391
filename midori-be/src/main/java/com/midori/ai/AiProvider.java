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

    /**
     * Generate questions with explicit user-selected skills (Generate from
     * Learning Content flow). {@code selectedSkills} may be null/empty for
     * legacy callers.
     *
     * <p>The default implementation delegates to the legacy
     * 6-arg overload so existing providers keep working without changes.
     */
    default String generateQuestions(String materialTitle, String materialContent,
                                     int questionCount, String questionType, String difficulty,
                                     java.util.List<String> selectedSkills, AiTaskType taskType) {
        return generateQuestions(materialTitle, materialContent, questionCount, questionType, difficulty);
    }

    /**
     * Generate questions with a strict per-difficulty distribution and a
     * strict question type. The {@code distributionLine} argument is a
     * pre-formatted string (e.g. {@code "EASY=3, MEDIUM=5, HARD=2"}) that the
     * provider passes directly into the AI prompt so the model is told the
     * exact split before it generates anything.
     *
     * <p>The default implementation falls back to the legacy
     * single-difficulty prompt so existing providers keep working.
     */
    default String generateQuestionsWithDistribution(String materialTitle, String materialContent,
                                                     int distributionTotal, String questionType,
                                                     String distributionLine,
                                                     java.util.List<String> selectedSkills,
                                                     AiTaskType taskType) {
        String dominantDifficulty = "Medium";
        if (distributionLine != null && !distributionLine.isBlank()) {
            try {
                int maxVal = -1;
                String[] parts = distributionLine.split(",");
                for (String part : parts) {
                    String[] kv = part.split("=");
                    if (kv.length == 2) {
                        String diff = kv[0].trim();
                        int val = Integer.parseInt(kv[1].trim());
                        if (val > maxVal) {
                            maxVal = val;
                            dominantDifficulty = diff.substring(0, 1).toUpperCase() + diff.substring(1).toLowerCase();
                        }
                    }
                }
            } catch (Exception e) {
                dominantDifficulty = "Medium";
            }
        }
        return generateQuestions(materialTitle, materialContent, distributionTotal,
                questionType, dominantDifficulty, selectedSkills, taskType);
    }

    /**
     * Generate questions in multiple formats simultaneously.
     *
     * @param materialTitle the material title
     * @param materialContent the material content
     * @param distributionTotal total number of questions
     * @param distributionLine pre-formatted difficulty distribution string
     * @param selectedSkills list of selected skills
     * @param selectedFormats list of selected question formats
     * @return JSON string containing questions in multiple formats
     */
    default String generateMultiFormatQuestions(String materialTitle, String materialContent,
                                              int distributionTotal, String distributionLine,
                                              java.util.List<String> selectedSkills,
                                              java.util.List<String> selectedFormats,
                                              AiTaskType taskType) {
        // Default: generate multi-format using chat endpoint
        String prompt = com.midori.ai.prompt.AiPromptBuilder.buildMultiFormatQuizGenerationPrompt(
                materialTitle, materialContent, distributionTotal, distributionLine,
                selectedSkills, selectedFormats);
        return chat("You are AI Sensei of MIDORI, a Japanese tutor for Vietnamese learners.", prompt, null, taskType);
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

    default String getLastFinishReason() { return null; }
    default Integer getLastPromptTokens() { return null; }
    default Integer getLastCompletionTokens() { return null; }
    default Integer getLastTotalTokens() { return null; }
    default int getLastKeyIndex() { return 0; }
    default String getLastKeyId() { return null; }
    default void clearMetrics() {}

    /**
     * Checks if this provider has at least one model and key route that is configured,
     * not cooling down globally, and has not failed in the current request scope.
     */
    default boolean hasAvailableRoute(AiTaskType taskType) {
        return isConfigured();
    }
}
