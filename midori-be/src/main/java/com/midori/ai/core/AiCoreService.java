package com.midori.ai.core;

import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderFactory;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.exception.AiProcessingException;
import com.midori.ai.prompt.AiPromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Central AI orchestration service.
 * 
 * All AI operations MUST go through this service.
 * Business modules should NEVER call providers directly.
 * 
 * Features:
 * - Unified interface for all AI operations
 * - Automatic provider selection and fallback
 * - Transparent key rotation for multi-key providers
 * - Centralized error handling and logging
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiCoreService {

    private final AiProviderFactory providerFactory;
    private final AiConfigProperties config;

    // ============================================================
    // Chat / Conversation
    // ============================================================

    /**
     * Send a chat message using the configured AI provider.
     *
     * @param systemPrompt  the system prompt
     * @param userMessage   the user message
     * @param history      conversation history as [role, content] pairs
     * @return the AI response text
     */
    public String chat(String systemPrompt, String userMessage, List<String[]> history) {
        AiProvider provider = providerFactory.resolve();
        return provider.chat(systemPrompt, userMessage, history, com.midori.ai.AiTaskType.COMPLEX_REASONING);
    }

    /**
     * Send a chat message with material context.
     */
    public String chatWithMaterial(String materialTitle, String materialType,
                                  String materialLevel, String materialContent,
                                  String userMessage, List<String[]> history) {
        String systemPrompt = AiPromptBuilder.buildChatSystemPromptWithMaterial(
                materialTitle, materialType, materialLevel, materialContent);
        return chat(systemPrompt, userMessage, history);
    }

    // ============================================================
    // Question Generation
    // ============================================================

    /**
     * Generate quiz questions using AI.
     */
    public String generateQuestions(String topic, String materialContent,
                                   int count, String type, String difficulty) {
        AiProvider provider = providerFactory.resolve();
        return provider.generateQuestions(topic, materialContent, count, type, difficulty, com.midori.ai.AiTaskType.COMPLEX_REASONING);
    }


    // ============================================================
    // Provider Information
    // ============================================================

    /**
     * Get the currently configured provider.
     */
    public AiProvider getCurrentProvider() {
        return providerFactory.resolve();
    }

    /**
     * Get all available providers.
     */
    public List<AiProvider> getAllProviders() {
        return providerFactory.getAllAvailable();
    }

    /**
     * Get provider status summary.
     */
    public String getStatus() {
        StringBuilder sb = new StringBuilder();
        sb.append("AI Core Status:\n");
        
        for (AiProvider p : providerFactory.getAllAvailable()) {
            sb.append(String.format("  - %s: %s\n", 
                    p.getName(), 
                    p.isConfigured() ? "configured" : "NOT CONFIGURED"));
        }
        
        AiProvider current = providerFactory.resolve();
        sb.append(String.format("Current provider: %s\n", current.getName()));
        
        return sb.toString();
    }
}
