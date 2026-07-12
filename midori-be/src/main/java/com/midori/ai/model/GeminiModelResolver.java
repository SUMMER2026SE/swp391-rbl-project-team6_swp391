package com.midori.ai.model;

import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Resolves the best Gemini model for a given task type using configuration only.
 *
 * <p>This component is intentionally stateless so future models can be added
 * without changing Java code: update {@code ai.gemini.*} properties.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiModelResolver {

    private final AiConfigProperties config;

    /**
     * Resolve the preferred model for the given task context.
     *
     * <p>Resolution order:
     * 1. Task-specific mapping from config.
     * 2. Global fallback models from config.
     * 3. Legacy primary model from config as last resort.
     */
    public ModelResolutionResult resolve(ModelSelectionContext context) {
        Objects.requireNonNull(context, "context");
        AiTaskType taskType = context.taskType() != null ? context.taskType() : AiTaskType.DEFAULT;
        String operation = context.operation() != null ? context.operation() : "operation";

        List<String> configuredModels = getConfiguredModels();
        if (configuredModels.isEmpty()) {
            throw new IllegalStateException("No Gemini models configured. Set ai.gemini.models or ai.gemini.model.");
        }

        Map<AiTaskType, String> mapping = getTaskModelMapping();
        String preferredModel = mapping.get(taskType);
        if (preferredModel == null || preferredModel.isBlank()) {
            preferredModel = mapping.get(AiTaskType.DEFAULT);
        }

        List<String> candidates = new ArrayList<>();
        if (preferredModel != null && !preferredModel.isBlank()) {
            candidates.add(preferredModel.trim());
        }
        for (String model : configuredModels) {
            String trimmed = model.trim();
            if (!candidates.contains(trimmed)) {
                candidates.add(trimmed);
            }
        }

        String selected = candidates.get(0);
        String reason = buildReason(taskType, selected, operation, preferredModel);

        log.info("[GeminiModelResolver] Resolved model for task={}, operation={}, selected={}, reason={}",
                taskType, operation, selected, reason);

        return new ModelResolutionResult(selected, reason, taskType.name(), candidates);
    }

    public List<String> getConfiguredModels() {
        String models = config.getGemini().getModels();
        if (models == null || models.isBlank()) {
            String single = config.getGemini().getModel();
            return single != null && !single.isBlank() ? List.of(single) : List.of();
        }
        return Arrays.stream(models.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private Map<AiTaskType, String> getTaskModelMapping() {
        Map<String, String> raw = config.getGemini().getTaskModelMapping();
        Map<AiTaskType, String> mapping = new EnumMap<>(AiTaskType.class);

        for (AiTaskType type : AiTaskType.values()) {
            String value = raw.get(type.name());
            if (value != null && !value.isBlank()) {
                mapping.put(type, value.trim());
            }
        }
        return mapping;
    }

    private String buildReason(AiTaskType taskType, String selectedModel, String operation, String preferredModel) {
        if (preferredModel != null && !preferredModel.isBlank() && preferredModel.equals(selectedModel)) {
            return "Task '" + taskType + "' explicitly mapped to '" + selectedModel + "' for " + operation;
        }
        if (preferredModel != null && !preferredModel.isBlank()) {
            return "Task '" + taskType + "' preferred '" + preferredModel + "' for " + operation
                    + ", but it is unavailable in configured models; using '" + selectedModel + "'";
        }
        return "No explicit mapping for task '" + taskType + "' for " + operation
                + "; using configured primary model '" + selectedModel + "'";
    }
}
