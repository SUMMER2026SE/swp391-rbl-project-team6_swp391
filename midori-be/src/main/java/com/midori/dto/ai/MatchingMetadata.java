package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Format-specific metadata for MATCHING questions.
 * Contains left/right item lists and the correct pair mappings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingMetadata {
    /** Items on the left side (e.g., Japanese words) */
    private List<String> leftItems;
    /** Items on the right side (e.g., Vietnamese meanings) */
    private List<String> rightItems;
    /** Correct pair mappings as list of [leftIndex, rightIndex] pairs */
    private List<MatchingPair> correctPairs;
}
