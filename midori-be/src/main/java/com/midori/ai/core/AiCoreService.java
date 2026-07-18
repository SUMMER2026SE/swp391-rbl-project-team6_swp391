package com.midori.ai.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderFactory;
import com.midori.ai.AiProviderType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.exception.AiProcessingException;
import com.midori.ai.prompt.AiPromptBuilder;
import com.midori.ai.util.AiExistingQuestionParser;
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
        AiProvider provider = resolveProvider();
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
     *
     * <p>Variants:
     * <ul>
     *   <li>{@code selectedSkills} non-null/non-empty: Generate from Learning
     *       Content flow. The prompt asks the AI to set each question's
     *       {@code category} to one of the selected skills, forbids romaji in
     *       Japanese readings, and forbids duplicate options.</li>
     *   <li>{@code selectedSkills} null/empty: legacy chat-style flow used by
     *       the AI Sensei chat surface.</li>
     * </ul>
     */
    public String generateQuestions(String topic, String materialContent,
                                   int count, String type, String difficulty,
                                   java.util.List<String> selectedSkills) {
        AiProvider provider = resolveProvider();
        return provider.generateQuestions(topic, materialContent, count, type, difficulty,
                selectedSkills, com.midori.ai.AiTaskType.COMPLEX_REASONING);
    }

    /**
     * Backwards-compatible overload without {@code selectedSkills}.
     */
    public String generateQuestions(String topic, String materialContent,
                                   int count, String type, String difficulty) {
        return generateQuestions(topic, materialContent, count, type, difficulty, null);
    }

    // ============================================================
    // Exam Parsing (PDF)
    // ============================================================

    /**
     * Parse exam from PDF text using AI.
     */
    public AiExamParseResponse parseExam(String extractedText, String filename)
            throws AiProcessingException {
        AiProvider provider = providerFactory.resolve();
        return provider.parseExamFromText(extractedText, filename, com.midori.ai.AiTaskType.LONG_DOCUMENT_ANALYSIS);
    }

    /**
     * Parse already-written questions from extracted PDF text using the
     * configured AI provider, then return a structured
     * {@link AiExamParseResponse} suitable for the IMPORT_EXISTING_QUESTIONS
     * preview flow.
     *
     * <p>Unlike {@link #parseExam(String, String)} this path uses the provider's
     * generic {@code chat()} capability with a language-neutral prompt
     * ({@link AiPromptBuilder#buildExistingQuestionsParsingPrompt(String, String, String)}).
     * The previous JLPT-biased prompt often returned an empty
     * {@code questions} array for plain English PDFs, which the providers'
     * strict {@code validateResult} converted into an exception that surfaced
     * to the UI as "AI could not extract questions…".
     *
     * <p>This method is more defensive on three axes:
     * <ol>
     *   <li>The prompt itself is language-neutral and demands a strict JSON shape.</li>
     *   <li>The LLM response is cleaned via {@link #cleanJsonResponse(String)}
     *       which strips markdown fences and tries a second pass on the last
     *       balanced {@code {…}} block when the first parse fails.</li>
     *   <li>An empty {@code questions} array is NOT converted to an exception
     *       here — the controller maps it to a clear preview response.</li>
     * </ol>
     *
     * @param selectedSkills list of target skills to filter questions (can be null)
     * @return parsed response (may have empty questions list when the LLM
     *         genuinely cannot find any questions; never null from this method).
     * @throws AiProcessingException only when no provider is configured or
     *         every model failed AND the response cannot be parsed as JSON.
     */
    public AiExamParseResponse parseExistingQuestionsFromText(String extractedText, String filename, List<String> selectedSkills)
            throws AiProcessingException {
        if (extractedText == null || extractedText.isBlank()) {
            throw new AiProcessingException("Cannot parse empty PDF text.");
        }

        AiProvider provider = providerFactory.resolve();
        if (provider == null || !provider.isConfigured()) {
            throw new AiProcessingException("No AI provider is configured for IMPORT_EXISTING_QUESTIONS.");
        }

        String systemPrompt = "You are an exam-digitization assistant. "
                + "You always reply with a single valid JSON object. "
                + "Never include markdown fences or commentary around the JSON.";

        // Convert selectedSkills list to comma-separated string
        String skillsParam = null;
        if (selectedSkills != null && !selectedSkills.isEmpty()) {
            skillsParam = String.join(",", selectedSkills);
        }
        String userPrompt = AiPromptBuilder.buildExistingQuestionsParsingPrompt(extractedText, filename, skillsParam);

        String raw;
        try {
            raw = provider.chat(systemPrompt, userPrompt, null, com.midori.ai.AiTaskType.LONG_DOCUMENT_ANALYSIS);
        } catch (Exception e) {
            throw new AiProcessingException("AI chat failed: " + e.getMessage(), e);
        }

        if (raw == null || raw.isBlank()) {
            log.warn("[AiCoreService.parseExistingQuestionsFromText] Provider {} returned empty body",
                    provider.getName());
            return AiExamParseResponse.empty();
        }

        log.info("[AiCoreService.parseExistingQuestionsFromText] {} returned {} chars",
                provider.getName(), raw.length());

        try {
            return parseExamResponseFromChat(raw);
        } catch (AiProcessingException e) {
            log.warn("[AiCoreService.parseExistingQuestionsFromText] AI JSON parse failed ({}). "
                    + "Falling back to rule-based parser. First 200 chars: {}",
                    e.getMessage(), abbreviate(AiExistingQuestionParser.cleanJsonResponse(raw), 200));
            AiExamParseResponse fallbackResult = AiExistingQuestionParser.parseFromSourceText(extractedText);
            if (fallbackResult.getQuestions() != null && !fallbackResult.getQuestions().isEmpty()) {
                log.info("[AiCoreService.parseExistingQuestionsFromText] Rule-based fallback extracted {} questions",
                        fallbackResult.getQuestions().size());
                return fallbackResult;
            }
            throw new AiProcessingException("AI could not parse the PDF content, and rule-based fallback also found no questions. "
                    + "Please check that the PDF contains readable multiple-choice questions with labeled options (A/B/C/D).", e);
        } catch (Exception e) {
            log.warn("[AiCoreService.parseExistingQuestionsFromText] Unexpected parse failure ({}). "
                    + "Falling back to rule-based parser. First 200 chars: {}",
                    e.getMessage(), abbreviate(AiExistingQuestionParser.cleanJsonResponse(raw), 200));
            AiExamParseResponse fallbackResult = AiExistingQuestionParser.parseFromSourceText(extractedText);
            if (fallbackResult.getQuestions() != null && !fallbackResult.getQuestions().isEmpty()) {
                log.info("[AiCoreService.parseExistingQuestionsFromText] Rule-based fallback extracted {} questions",
                        fallbackResult.getQuestions().size());
                return fallbackResult;
            }
            throw new AiProcessingException("AI response was not parseable, and rule-based fallback also found no questions. "
                    + "Please check that the PDF contains readable multiple-choice questions.", e);
        }
    }

    /**
     * Clean the LLM's chat output and deserialize it as
     * {@link AiExamParseResponse}.
     *
     * <p>Defensive pipeline:
     * <ol>
     *   <li>{@link AiExistingQuestionParser#cleanJsonResponse(String)} strips
     *       markdown fences and surrounding prose.</li>
     *   <li>The cleaner is followed by a tolerant normalizer
     *       ({@link AiExistingQuestionParser#parseAndNormalize(String, ObjectMapper)})
     *       that maps every accepted alias (question/questionText/content/text,
     *       answers/options/choices, isCorrect/correct/correctAnswer/...) onto
     *       the canonical {@link AiExamParseResponse} shape, supports three
     *       option shapes (string array / labeled objects / A→text map), and
     *       finally runs {@link AiExistingQuestionParser#sanitize(AiExamParseResponse)}
     *       so the controller never blows up on partial output.</li>
     * </ol>
     *
     * <p>Errors here are converted into a short, user-friendly message; the
     * raw first-200-character body is logged for debugging only and never
     * surfaced into the UI.
     */
    private AiExamParseResponse parseExamResponseFromChat(String raw) throws AiProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        try {
            return AiExistingQuestionParser.parseAndNormalize(raw, mapper);
        } catch (IllegalArgumentException e) {
            log.warn("[AiCoreService] AI JSON parse failed ({}). First 200 chars: {}",
                    e.getMessage(), abbreviate(AiExistingQuestionParser.cleanJsonResponse(raw), 200));
            throw new AiProcessingException("AI response was not parseable as the expected questions JSON.");
        } catch (Exception e) {
            log.warn("[AiCoreService] AI JSON parse failed unexpectedly: {}. First 200 chars: {}",
                    e.getMessage(), abbreviate(AiExistingQuestionParser.cleanJsonResponse(raw), 200));
            throw new AiProcessingException("AI response was not parseable as the expected questions JSON.");
        }
    }

    private static String abbreviate(String s, int max) {
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max) + "…";
    }

    // ============================================================
    // Provider Information
    // ============================================================

    /**
     * Resolve the configured provider, with null-safety for invalid enum values.
     * If the config provider is invalid or null, falls back to the first configured provider.
     */
    private AiProvider resolveProvider() {
        try {
            String cfg = config.getProvider();
            if (cfg != null && !cfg.isBlank()) {
                AiProviderType type = AiProviderType.valueOf(cfg.toUpperCase().trim());
                return providerFactory.resolveOrDefault(type);
            }
        } catch (IllegalArgumentException e) {
            log.warn("[AiCoreService] Unknown AI provider '{}', falling back to first configured", config.getProvider());
        }
        return providerFactory.resolveOrDefault(AiProviderType.OPENROUTER);
    }

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
