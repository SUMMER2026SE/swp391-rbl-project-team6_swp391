package com.midori.dto.grammar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Lightweight grammar pattern summary for the video Grammar tab list view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarPatternSummaryResponse {

    private UUID id;
    private String pattern;
    private String jlptLevel;

    /** Short Vietnamese meaning snippet (may be null if not yet translated). */
    private String meaningVi;

    /** Short English meaning (always present from Hanabira JSON). */
    private String meaningEn;

    /** Whether a full Vietnamese translation is available in the DB. */
    private boolean meaningViAvailable;
}
