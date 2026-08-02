package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single correct pair in a MATCHING question.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingPair {
    /** Index in the left items list */
    private int leftIndex;
    /** Index in the right items list */
    private int rightIndex;
}
