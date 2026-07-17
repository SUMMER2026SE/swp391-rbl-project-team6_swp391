package com.midori.ai.model;

import com.midori.ai.AiTaskType;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Enum representing all supported Gemini models.
 * 
 * <p>Each enum value contains:
 * <ul>
 *   <li>{@code apiModelName} - The exact model identifier used in API calls</li>
 *   <li>{@code displayName} - Human-readable name for UI display</li>
 *   <li>{@code description} - Brief description of the model's capabilities</li>
 *   <li>{@code capabilityLevel} - Relative capability (1-5, higher = more capable)</li>
 *   <li>{@code costLevel} - Relative cost (1-5, higher = more expensive)</li>
 *   <li>{@code contextWindow} - Maximum context window in tokens</li>
 *   <li>{@code supportedTaskTypes} - Task types this model is optimized for</li>
 * </ul>
 * 
 * <p><b>Adding a new model:</b>
 * <ol>
 *   <li>Add a new enum entry with appropriate metadata</li>
 *   <li>Update {@code GeminiModelResolver} if needed for AUTO mode selection</li>
 * </ol>
 * No other code changes required.
 */
public enum GeminiModel {
    
    /**
     * Gemini 1.5 Flash - Highly stable and widely supported model.
     */
    GEMINI_15_FLASH(
            "gemini-1.5-flash",
            "Gemini 1.5 Flash",
            "Highly stable and cost-effective model for general tasks",
            2,  // capability
            1,  // cost
            128000,  // context window
            AiTaskType.DEFAULT,
            AiTaskType.SIMPLE_TRANSLATION,
            AiTaskType.SHORT_ANSWER,
            AiTaskType.LONG_DOCUMENT_ANALYSIS,
            AiTaskType.COMPLEX_REASONING,
            AiTaskType.SHADOWING_EVALUATION
    ),

    /**
     * Gemini 1.5 Pro - Highly stable pro model.
     */
    GEMINI_15_PRO(
            "gemini-1.5-pro",
            "Gemini 1.5 Pro",
            "Stable pro model for complex reasoning and analysis",
            4,  // capability
            3,  // cost
            128000,  // context window
            AiTaskType.COMPLEX_REASONING,
            AiTaskType.LONG_DOCUMENT_ANALYSIS
    ),

    /**
     * Gemini 2.5 Flash - Modern fast and cost-effective model.
     */
    GEMINI_25_FLASH(
            "gemini-2.5-flash",
            "Gemini 2.5 Flash",
            "Fast and cost-effective model, recommended for general tasks",
            3,  // capability
            1,  // cost
            128000,  // context window
            AiTaskType.DEFAULT,
            AiTaskType.SIMPLE_TRANSLATION,
            AiTaskType.SHORT_ANSWER,
            AiTaskType.LONG_DOCUMENT_ANALYSIS,
            AiTaskType.COMPLEX_REASONING,
            AiTaskType.SHADOWING_EVALUATION
    ),

    /**
     * Gemini 2.0 Pro - Next-generation pro model.
     */
    GEMINI_20_PRO(
            "gemini-2.0-pro-exp-02-05",
            "Gemini 2.0 Pro (Experimental)",
            "Next-generation pro model with advanced reasoning capabilities",
            5,  // capability
            4,  // cost
            128000,  // context window
            AiTaskType.COMPLEX_REASONING,
            AiTaskType.LONG_DOCUMENT_ANALYSIS
    ),

    /**
     * Gemini 2.5 Pro - Balanced for complex reasoning.
     * Best for: Complex reasoning, analysis, question generation.
     */
    GEMINI_25_PRO(
            "gemini-2.5-pro",
            "Gemini 2.5 Pro",
            "Balanced model for complex reasoning, deep analysis, and nuanced understanding",
            4,  // capability
            3,  // cost
            128000,  // context window
            AiTaskType.COMPLEX_REASONING,
            AiTaskType.LONG_DOCUMENT_ANALYSIS
    ),
    
    /**
     * Gemini 3.5 Flash - Latest fast model (future/placeholder).
     * Best for: When available, replaces 2.5 Flash for better performance.
     */
    GEMINI_35_FLASH(
            "gemini-3.5-flash",
            "Gemini 3.5 Flash",
            "Next-generation fast model with improved accuracy and lower latency",
            3,  // capability
            2,  // cost
            128000,  // context window
            AiTaskType.DEFAULT,
            AiTaskType.LONG_DOCUMENT_ANALYSIS,
            AiTaskType.COMPLEX_REASONING
    ),

    /**
     * Gemini Flash Latest - Auto-updating latest stable flash model.
     */
    GEMINI_FLASH_LATEST(
            "gemini-flash-latest",
            "Gemini Flash (Latest)",
            "Auto-updating latest stable flash model",
            3,  // capability
            1,  // cost
            128000,  // context window
            AiTaskType.DEFAULT,
            AiTaskType.SIMPLE_TRANSLATION,
            AiTaskType.SHORT_ANSWER,
            AiTaskType.LONG_DOCUMENT_ANALYSIS,
            AiTaskType.COMPLEX_REASONING,
            AiTaskType.SHADOWING_EVALUATION
    ),

    /**
     * Gemini 2.0 Flash - Newer fast model.
     */
    GEMINI_20_FLASH(
            "gemini-2.0-flash",
            "Gemini 2.0 Flash",
            "Fast and capable model for general tasks",
            3,  // capability
            1,  // cost
            128000,  // context window
            AiTaskType.DEFAULT,
            AiTaskType.SIMPLE_TRANSLATION,
            AiTaskType.SHORT_ANSWER,
            AiTaskType.LONG_DOCUMENT_ANALYSIS,
            AiTaskType.COMPLEX_REASONING,
            AiTaskType.SHADOWING_EVALUATION
    );

    private final String apiModelName;
    private final String displayName;
    private final String description;
    private final int capabilityLevel;  // 1-5
    private final int costLevel;        // 1-5
    private final int contextWindow;
    private final List<AiTaskType> supportedTaskTypes;

    GeminiModel(String apiModelName, String displayName, String description,
                int capabilityLevel, int costLevel, int contextWindow,
                AiTaskType... supportedTaskTypes) {
        this.apiModelName = apiModelName;
        this.displayName = displayName;
        this.description = description;
        this.capabilityLevel = capabilityLevel;
        this.costLevel = costLevel;
        this.contextWindow = contextWindow;
        this.supportedTaskTypes = Arrays.asList(supportedTaskTypes);
    }

    /**
     * Get the API model name used in Gemini API calls.
     */
    public String getApiModelName() {
        return apiModelName;
    }

    /**
     * Get human-readable display name.
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get model description.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Get capability level (1-5, higher = more capable).
     */
    public int getCapabilityLevel() {
        return capabilityLevel;
    }

    /**
     * Get cost level (1-5, higher = more expensive).
     */
    public int getCostLevel() {
        return costLevel;
    }

    /**
     * Get maximum context window in tokens.
     */
    public int getContextWindow() {
        return contextWindow;
    }

    /**
     * Check if this model supports the given task type.
     */
    public boolean supportsTaskType(AiTaskType taskType) {
        return supportedTaskTypes.contains(taskType);
    }

    /**
     * Get list of supported task types.
     */
    public List<AiTaskType> getSupportedTaskTypes() {
        return supportedTaskTypes;
    }

    /**
     * Find a GeminiModel by its API model name.
     * 
     * @param apiModelName the API model name (e.g., "gemini-2.5-flash")
     * @return the matching GeminiModel or empty if not found
     */
    public static Optional<GeminiModel> fromApiModelName(String apiModelName) {
        if (apiModelName == null || apiModelName.isBlank()) {
            return Optional.empty();
        }
        String normalized = apiModelName.trim().toLowerCase();
        return Arrays.stream(values())
                .filter(m -> m.apiModelName.equalsIgnoreCase(normalized))
                .findFirst();
    }

    /**
     * Find a GeminiModel by its API model name, with fallback.
     * 
     * @param apiModelName the API model name
     * @param fallback the default model if not found
     * @return the matching GeminiModel or fallback
     */
    public static GeminiModel fromApiModelNameOrDefault(String apiModelName, GeminiModel fallback) {
        return fromApiModelName(apiModelName).orElse(fallback);
    }

    /**
     * Get the default/fallback model.
     */
    public static GeminiModel getDefault() {
        return GEMINI_25_FLASH;
    }

    /**
     * Get the best model for a given task type based on capability/cost ratio.
     */
    public static GeminiModel getBestForTask(AiTaskType taskType) {
        return Arrays.stream(values())
                .filter(m -> m.supportsTaskType(taskType))
                .max((a, b) -> {
                    // Prefer higher capability with lower cost
                    int scoreA = a.capabilityLevel * 10 - a.costLevel * 2;
                    int scoreB = b.capabilityLevel * 10 - b.costLevel * 2;
                    return Integer.compare(scoreA, scoreB);
                })
                .orElse(GEMINI_25_FLASH);
    }

    @Override
    public String toString() {
        return String.format("%s (%s) - %s [capability=%d, cost=%d]",
                displayName, apiModelName, description, capabilityLevel, costLevel);
    }
}
