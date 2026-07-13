package com.midori.ai.model;

import java.util.List;

/**
 * Result of resolving a model for a specific task.
 */
public record ModelResolutionResult(String selectedModel,
                                    String reason,
                                    String taskType,
                                    List<String> candidates) {
}
