package com.midori.ai.model;

import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Centralized model selection for Gemini API.
 * 
 * <p>Responsibilities:
 * <ul>
 *   <li>Resolve configured model from YAML/application properties</li>
 *   <li>Support AUTO mode for automatic task-based selection</li>
 *   <li>Validate that configured models are supported</li>
 *   <li>Return default model if configuration is invalid</li>
 *   <li>Provide detailed logging for every selection</li>
 * </ul>
 * 
 * <p><b>Key principle:</b> Business code should NEVER compare model strings.
 * Always use {@link GeminiModel} enum values or this resolver.
 * 
 * <p><b>Configuration:</b>
 * <pre>
 * ai:
 *   gemini:
 *     model: AUTO          # AUTO, gemini-2.5-flash, gemini-2.5-pro, etc.
 *     models:              # Available models for AUTO mode
 *       - gemini-2.5-flash
 *       - gemini-2.5-pro
 *     task-model-mapping:  # Task-specific overrides
 *       DEFAULT: gemini-2.5-flash
 *       COMPLEX_REASONING: gemini-2.5-pro
 * </pre>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiModelResolver {

    public static final String AUTO_MODE = "AUTO";
    
    private final AiConfigProperties config;

    // ============================================================
    // Public API
    // ============================================================

    /**
     * Resolve the best model for the given context.
     * 
     * @param context Selection context including task type, caller, operation
     * @return Resolution result with selected model and metadata
     */
    public ModelResolutionResult resolve(ModelSelectionContext context) {
        Objects.requireNonNull(context, "context");
        AiTaskType taskType = context.taskType() != null ? context.taskType() : AiTaskType.DEFAULT;
        String operation = context.operation() != null ? context.operation() : "operation";
        String caller = context.caller() != null ? context.caller() : "unknown";

        // Get configured model string
        String configuredModel = getConfiguredPrimaryModel();
        
        if (configuredModel == null || configuredModel.isBlank()) {
            log.warn("[GeminiModelResolver] No model configured, using default");
            configuredModel = GeminiModel.GEMINI_25_FLASH.getApiModelName();
        }

        // Handle AUTO mode
        if (AUTO_MODE.equalsIgnoreCase(configuredModel.trim())) {
            return resolveAutoMode(taskType, caller, operation);
        }

        // Resolve configured string to enum
        GeminiModel model = GeminiModel.fromApiModelNameOrDefault(
                configuredModel, 
                GeminiModel.getDefault()
        );

        String reason = String.format("Explicitly configured '%s' for %s", model.getApiModelName(), operation);
        
        logModelSelection(model, taskType, caller, operation, reason);
        
        return new ModelResolutionResult(
                model.getApiModelName(),
                reason,
                taskType.name(),
                List.of(model.getApiModelName())
        );
    }

    /**
     * Resolve model with explicit model specification.
     * 
     * @param modelSpec Model name string (AUTO or actual model name)
     * @param taskType Task type for AUTO mode
     * @param operation Operation name for logging
     * @return Resolution result
     */
    public ModelResolutionResult resolve(String modelSpec, AiTaskType taskType, String operation) {
        if (modelSpec == null || modelSpec.isBlank() || AUTO_MODE.equalsIgnoreCase(modelSpec.trim())) {
            return resolve(ModelSelectionContext.of(taskType, "direct", operation));
        }
        
        GeminiModel model = GeminiModel.fromApiModelNameOrDefault(modelSpec, GeminiModel.getDefault());
        String reason = String.format("Specified '%s' for %s", model.getApiModelName(), operation);
        
        logModelSelection(model, taskType, "direct", operation, reason);
        
        return new ModelResolutionResult(
                model.getApiModelName(),
                reason,
                taskType.name(),
                List.of(model.getApiModelName())
        );
    }

    /**
     * Simple resolve returning just the model.
     * 
     * @return The resolved GeminiModel
     */
    public GeminiModel resolveDefault() {
        ModelResolutionResult result = resolve(ModelSelectionContext.of(
                AiTaskType.DEFAULT, "default", "default"));
        return GeminiModel.fromApiModelNameOrDefault(result.selectedModel(), GeminiModel.getDefault());
    }

    // ============================================================
    // AUTO Mode Resolution
    // ============================================================

    /**
     * Resolve model using AUTO mode strategy.
     * 
     * <p>Strategy:
     * <ul>
     *   <li>DEFAULT task → Use fastest/cheapest capable model</li>
     *   <li>COMPLEX_REASONING → Use most capable model</li>
     *   <li>LONG_DOCUMENT_ANALYSIS → Use model with large context</li>
     *   <li>OCR → Use fastest model (capability less important)</li>
     * </ul>
     */
    private ModelResolutionResult resolveAutoMode(AiTaskType taskType, String caller, String operation) {
        log.info("[GeminiModelResolver] AUTO mode - selecting model for task={}, caller={}, operation={}",
                taskType, caller, operation);

        // Check task-specific mapping first
        GeminiModel mappedModel = getTaskSpecificModel(taskType);
        if (mappedModel != null) {
            String reason = String.format("AUTO mode: Task '%s' mapped to '%s' for %s",
                    taskType, mappedModel.getApiModelName(), operation);
            logModelSelection(mappedModel, taskType, caller, operation, reason);
            return new ModelResolutionResult(
                    mappedModel.getApiModelName(),
                    reason,
                    taskType.name(),
                    getAvailableModelNames()
            );
        }

        // Fallback to task-based selection
        GeminiModel selectedModel = selectModelForTask(taskType);
        String reason = String.format("AUTO mode: Task '%s' selected '%s' (cap=%d, cost=%d) for %s",
                taskType, selectedModel.getApiModelName(),
                selectedModel.getCapabilityLevel(), selectedModel.getCostLevel(),
                operation);
        
        logModelSelection(selectedModel, taskType, caller, operation, reason);
        
        return new ModelResolutionResult(
                selectedModel.getApiModelName(),
                reason,
                taskType.name(),
                getAvailableModelNames()
        );
    }

    /**
     * Select the best model for a specific task type.
     */
    private GeminiModel selectModelForTask(AiTaskType taskType) {
        List<GeminiModel> available = getAvailableModels();
        
        if (available.isEmpty()) {
            log.warn("[GeminiModelResolver] No models configured, using default");
            return GeminiModel.getDefault();
        }

        return switch (taskType) {
            case DEFAULT, SIMPLE_TRANSLATION, SHORT_ANSWER, SHADOWING_EVALUATION -> available.stream()
                    .filter(m -> m.supportsTaskType(taskType))
                    .min(Comparator.comparingInt(GeminiModel::getCostLevel))
                    .orElse(GeminiModel.GEMINI_25_FLASH);

            case COMPLEX_REASONING, ADMIN_CONTENT_LIBRARY_GENERATION -> available.stream()
                    .filter(m -> m.supportsTaskType(taskType))
                    .max(Comparator.comparingInt(GeminiModel::getCapabilityLevel))
                    .orElse(GeminiModel.GEMINI_25_PRO);

            case LONG_DOCUMENT_ANALYSIS -> available.stream()
                    .filter(m -> m.supportsTaskType(AiTaskType.LONG_DOCUMENT_ANALYSIS))
                    .max(Comparator.comparingInt(GeminiModel::getCapabilityLevel))
                    .orElse(GeminiModel.GEMINI_25_FLASH);

            case OCR -> available.stream()
                    .filter(m -> m.supportsTaskType(AiTaskType.OCR))
                    .min(Comparator.comparingInt(GeminiModel::getCostLevel))
                    .orElse(GeminiModel.GEMINI_25_FLASH);
        };
    }

    /**
     * Get task-specific model from configuration mapping.
     */
    private GeminiModel getTaskSpecificModel(AiTaskType taskType) {
        Map<String, String> mapping = config.getGemini().getTaskModelMapping();
        if (mapping == null || mapping.isEmpty()) {
            return null;
        }

        String modelName = mapping.get(taskType.name());
        if (modelName == null || modelName.isBlank()) {
            return null;
        }

        // Check if it's AUTO
        if (AUTO_MODE.equalsIgnoreCase(modelName.trim())) {
            return null; // Will use default AUTO logic
        }

        return GeminiModel.fromApiModelName(modelName).orElse(null);
    }

    // ============================================================
    // Configuration Helpers
    // ============================================================

    /**
     * Get the primary configured model from ai.gemini.model.
     */
    public String getConfiguredPrimaryModel() {
        return config.getGemini().getModel();
    }

    /**
     * Get all configured available models.
     */
    public List<String> getConfiguredModels() {
        String models = config.getGemini().getModels();
        if (models == null || models.isBlank()) {
            String single = config.getGemini().getModel();
            return single != null && !single.isBlank() ? List.of(single) : List.of();
        }
        return Arrays.stream(models.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .filter(s -> !AUTO_MODE.equalsIgnoreCase(s))
                .collect(Collectors.toList());
    }

    /**
     * Get available models as GeminiModel enums.
     */
    public List<GeminiModel> getAvailableModels() {
        return getConfiguredModels().stream()
                .map(name -> GeminiModel.fromApiModelNameOrDefault(name, null))
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Get available model names as strings.
     */
    public List<String> getAvailableModelNames() {
        return getAvailableModels().stream()
                .map(GeminiModel::getApiModelName)
                .collect(Collectors.toList());
    }

    /**
     * Check if AUTO mode is configured.
     */
    public boolean isAutoMode() {
        String model = getConfiguredPrimaryModel();
        return AUTO_MODE.equalsIgnoreCase(model);
    }

    /**
     * Check if a model name is valid/supported.
     */
    public boolean isValidModel(String modelName) {
        if (modelName == null || modelName.isBlank()) {
            return false;
        }
        if (AUTO_MODE.equalsIgnoreCase(modelName.trim())) {
            return true;
        }
        return GeminiModel.fromApiModelName(modelName).isPresent();
    }

    // ============================================================
    // Logging
    // ============================================================

    private void logModelSelection(GeminiModel model, AiTaskType taskType, 
                                   String caller, String operation, String reason) {
        log.info("[GeminiModelResolver] Model selected: {} for task: {} (reason: {})", model.getApiModelName(), taskType, reason);
        if (log.isDebugEnabled()) {
            log.debug("========================================");
            log.debug("[GeminiModelResolver] MODEL SELECTED DETAILS");
            log.debug("  Display Name: {}", model.getDisplayName());
            log.debug("  Caller: {}", caller);
            log.debug("  Operation: {}", operation);
            log.debug("  Capability Level: {}/5", model.getCapabilityLevel());
            log.debug("  Cost Level: {}/5", model.getCostLevel());
            log.debug("  Context Window: {} tokens", model.getContextWindow());
            log.debug("========================================");
        }
    }

    /**
     * Get a summary of all available models for debugging.
     */
    public String getAvailableModelsSummary() {
        StringBuilder sb = new StringBuilder();
        sb.append("Configured Primary Model: ").append(getConfiguredPrimaryModel()).append("\n");
        sb.append("Auto Mode: ").append(isAutoMode()).append("\n");
        sb.append("Available Models:\n");
        for (GeminiModel model : GeminiModel.values()) {
            sb.append(String.format("  - %s: %s [cap=%d, cost=%d]%n",
                    model.getApiModelName(),
                    model.getDisplayName(),
                    model.getCapabilityLevel(),
                    model.getCostLevel()));
        }
        return sb.toString();
    }
}
