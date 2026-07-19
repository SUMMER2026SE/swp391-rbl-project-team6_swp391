package com.midori.ai.model;

import java.util.List;

/**
 * Result of resolving a model for a specific task.
 * 
 * <p>Contains both the selected model name (string) and the enum value
 * for convenience. Use the enum for type-safe comparisons.
 */
public record ModelResolutionResult(
    /** The selected model name as used in API calls (e.g., "gemini-2.5-flash") */
    String selectedModel,
    /** Human-readable reason for model selection */
    String reason,
    /** The task type this model was selected for */
    String taskType,
    /** All available candidate models in priority order */
    List<String> candidates
) {
    /**
     * Get the selected model as a GeminiModel enum.
     * Returns default if the string doesn't match any known model.
     */
    public GeminiModel getSelectedModelEnum() {
        return GeminiModel.fromApiModelNameOrDefault(selectedModel, GeminiModel.getDefault());
    }

    /**
     * Get all candidates as GeminiModel enums.
     */
    public List<GeminiModel> getCandidateModels() {
        return candidates.stream()
                .map(name -> GeminiModel.fromApiModelNameOrDefault(name, null))
                .filter(m -> m != null)
                .toList();
    }

    /**
     * Check if this result came from AUTO mode selection.
     */
    public boolean isAutoSelected() {
        return reason != null && reason.contains("AUTO");
    }

    @Override
    public String toString() {
        return String.format("ModelResolutionResult{model='%s', taskType='%s', reason='%s', candidates=%d}",
                selectedModel, taskType, reason, candidates != null ? candidates.size() : 0);
    }
}
