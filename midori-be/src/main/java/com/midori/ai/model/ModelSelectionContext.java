package com.midori.ai.model;

import com.midori.ai.AiTaskType;

/**
 * Context information used for automatic model selection.
 *
 * <p>This allows the caller to provide task metadata so that model selection
 * can be driven by configuration rather than hardcoded rules.
 */
public record ModelSelectionContext(AiTaskType taskType, String caller, String operation) {

    public static ModelSelectionContext of(AiTaskType taskType, String caller, String operation) {
        return new ModelSelectionContext(taskType, caller, operation);
    }
}
