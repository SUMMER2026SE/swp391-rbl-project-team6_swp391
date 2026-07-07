package com.midori.service;

import java.util.List;

/**
 * Interface for LLM providers.
 */
public interface AiLlmProvider {

    /**
     * Get the provider name.
     */
    String getProviderName();

    /**
     * Check if the provider is configured (has valid API key).
     */
    boolean isConfigured();

    /**
     * Get the list of models configured for this provider.
     */
    List<String> getModels();

    /**
     * Get the last model that successfully responded.
     * Returns null if no successful call has been made yet.
     */
    String getLastModelUsed();

    /**
     * Send a chat message to the LLM.
     *
     * @param systemPrompt  the system prompt
     * @param userMessage   the user message
     * @param conversationHistory list of previous messages as [role, content] pairs
     * @return the LLM response
     */
    String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory);

    /**
     * Generate questions from material content.
     *
     * @param materialTitle   the material title
     * @param materialContent the material content
     * @param questionCount   number of questions
     * @param questionType    question type (MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE, MIXED)
     * @param difficulty      difficulty level (EASY, MEDIUM, HARD)
     * @return JSON string containing questions
     */
    String generateQuestions(String materialTitle, String materialContent, int questionCount, String questionType, String difficulty);
}
